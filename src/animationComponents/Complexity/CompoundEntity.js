import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Tube } from '@react-three/drei';
import CompoundEntityGroup from './CompoundEntityGroup';
import * as THREE from 'three';
import _ from 'lodash';
import * as utils from './utils';
import Particle from './Particle';
import ParticlesInstance from './ParticlesInstance';
import Blob from './Blob';
import Relations from './Relations';
import useAnimateRelations from './useAnimateRelations';
import useAnimateImpulses from './useAnimateImpulses';
import useAnimateJoints from './useAnimateJoints';
import useJoints from './useJoints';
import DebugRender from './DebugRender';
import useStoreEntity from './useStoreEntity';
import useStore from './../../useStore';
import useWhyDidYouUpdate from './useWhyDidYouUpdate';
import { useRapier, vec3, quat, RigidBody, BallCollider } from '@react-three/rapier';

// Need to order/delay transformation of Particle to CompoundEntity - should add joints one by one
// 2,2,3 Multiple levels of hierarchy joint goes missing
// Joint may not be ready because waiting for particle to remap joint but the jonit could be used in alignJointsToPolygon()
// joint Ref is not always valid e.g. when scaling the joint for new entity due to "No aRef or bRef for updateJoint" in updateJoint
// calculateJointOffsets needs to deal with different radius
// The ref may be to a CompoundEntity not a Particle so ew cannot create joint yet
//   Could delay joint creation so the joint ref is not invalid/null 
//   entitiesReadyDelayed should gaurantee all entities are ready (particles available)
//     This is passed down not up
//       Could check that all joints have particles but the transform could be in progress
//         Add a property to the node to indicaate rady ?
//         Better to loop over the joints to be transformed and check if ready
//  inNode or outNode could also be CompoundEnity with delay to find particles
//    Should not change particles to CompoundEnity until after joints are mapped ?
// setParticlesFirstDelayed(false); is not retriggering - need something like a counter ?
// Stuck in a deadlock waiting for particle
// Can we assume that if it is passed lower then we do not need to map it ? 
// Particles are there to transmit joints ?
//   That is why it is layer by layer ?
//   Need the mapping from particle to particle
//   Allow group to have joints
// Core gets thrown out of blob
//   Add joints to entities ? make it fixed and move with center ?
//   When particles are replaced joints are not updated for the core
// The blob particles can change dynamically so this needs to refresh on changes too
//   Problem for pre-calculating blob points
// particles[i].current.getVisualConfig().outerChain is probably not built as particles in blob are replaced
// chain is broken in buildOrderedIds
//   chainRef is broken - not accumulating joints for higher level
//   When we create a new CompoundEntity that replaces a particle then when we update the joints we also need to update chainRefs
//   If chainRef changes then we also need to reset the blobs
//     Maybe after each entity becomes stable we reset for the blobs ?
//       A separate condition to generate new blob data on joint updates
// Why are lower level blobs showing ?


const CompoundEntity = React.memo(React.forwardRef(({ id, initialPosition = [0, 0, 0], radius, debug, color, index, config, parentOuter = {}, ...props }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const nodeRef = useRef();
    useImperativeHandle(ref, () => nodeRef.current);
    const { world, rapier } = useRapier();

    // Direct access to the state outside of React's render flow
    const {
        getNode: directGetNode,
        updateNode: directUpdateNode,
        getAllParticleRefs: directGetAllParticleRefs,
        getJoint: directGetJoint,
        getJoints: directGetJoints,
        resetParticlesStable: directResetParticlesStable,
    } = useStoreEntity.getState();
    const setOption = useStore((state) => state.setOption);
    const getOption = useStore((state) => state.getOption);

    // Select so we are only sensitive to changes of this node
    const { node, entityNodes } = useStoreEntity(useCallback((state) => {
        const node = state.nodes[id];
        const entityNodes = (node.childrenIds || []).map(childId => state.nodes[childId]);
        return { node, entityNodes };
    }, [id]));
    const isDebug = node.debug || debug || config.debug;
    const entityCount = node.childrenIds.length;
    // Store the color in a a state so it is consistent across renders (when defined by a function)
    const configColor = config.colors[node.depth];
    const localColor = useMemo(() => utils.getColor(configColor, color), [configColor, color]);
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    //const entityRadius = entityCount ? radius / entityCount : radius; // Fixed to help with testing
    const entityRadius = useMemo(() => Math.min(radius * Math.PI / (entityCount + Math.PI), radius / 2) * 0.97, [radius, entityCount]);
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    const worldCenterRef = useRef(new THREE.Vector3());
    // State machine that can distribute computation across frames
    const frameStateRef = useRef("init");
    const [physicsState, setPhysicsState] = useState("waiting");
    // A function to encapsulate the condition
    const isPhysicsReady = () => physicsState === "ready";
    const [entitiesToInstantiate, setEntitiesToInstantiate] = useState([]);
    // Block the instnatiating of next entity
    const busyInstantiatingRef = useRef(false);
    const instantiatingIdRef = useRef();
    const [instantiateJoints, setInstantiateJoints] = useState([]);
    const activeJointsQueueRef = useRef([]);
    const [replaceJointWith, setReplaceJointWith] = useState([]);
    const [entityInstantiated, setEntityInstantiated] = useState();
    const [entitiesReady, setEntitiesReady] = useState(false);
    const [entitiesReadyDelayed, setEntitiesReadyDelayed] = useState(false);
    const [coreActive, setCoreActive] = useState();
    const coreRef = useRef();
    const coreColliderRef = useRef();
    const coreInitialPositionRef = useRef();
    const axis = new THREE.Vector3(0, 0, 1); // 2D Axis
    const [particlesFirst, setParticlesFirst] = useState(true);
    const [prevParticlesFirst, setPrevParticlesFirst] = useState(true);
    const [particlesFirstDelayed, setParticlesFirstDelayed] = useState(true);
    const jointsFromRef = useRef({});
    const jointsToRef = useRef({});
    const scaleJoint = 2.1; // Slightly bigger to avoid "hitting" the surrounding particles
    const quaternion = props.initialQuaternion || new THREE.Quaternion();
    const quaternionInverted = quaternion.clone().invert();
    const jointsToInRef = useRef(props.jointsTo || []);
    const jointsFromInRef = useRef(props.jointsFrom || []);
    const [particleReady, setParticleReady] = useState({});
    const [jointsMapped, setJointsMapped] = useState(true);
    const [triggerJoints, setTriggerJoints] = useState(false);
    const [initiatedCore, setInitiatedCore] = useState(false);
    const particlesInstanceRef = useRef();
    const animDelay = 250;
    const [allParticlesReady, setAllParticlesReady] = useState(false);
    const outerNodesRef = useRef({});
    
    const entityPositionsRef = useRef([]);
    const entityOrientationsRef = useRef({});

    const { initializeJoints, deleteJoint, createJoint, updateJoint, addLink } = useJoints();

    //useAnimateImpulses(isPhysicsReady(), node, entityNodes, initialPosition, radius, config);
    useAnimateRelations(isPhysicsReady(), node, entityNodes, config);
    useAnimateJoints(isPhysicsReady(), node, entityNodes, deleteJoint, createJoint, config);

    useEffect(() => {
        directUpdateNode(id, { initialPosition });
        console.log(`Mounting CompoundEntity ${id} at depth ${node.depth}`);
        node.ref.current.setVisualConfig({ color: color, uniqueId: id, radius: radius });
        if (node.childrenIds.length > 0 && node.isParticle) {
            // This is because we may be swaping the node from a Particle to a CompoundEntity
            // Need to correct this so the storeEntity maintains a valid list of Particles
            directUpdateNode(id, {isParticle: false});
        }
        console.log("props.jointsFrom", id, props.jointsFrom);
    }, []);

    useEffect(() => {
        return;
        if (physicsState === "initialize") {
            node.ref.current.setVisualConfig({ color: color, uniqueId: id, radius: radius });
            const allParticleRefs = directGetAllParticleRefs(id);
            node.particlesRef.current = allParticleRefs;
            initializeJoints(node, entityPositions);
            setPhysicsState("ready");
            if (!getOption("pausePhysics")) setOption("pausePhysics", true);
        }
    }, [physicsState]);

    useEffect(() => {
        if (particlesFirst !== prevParticlesFirst) { 
            setPrevParticlesFirst(particlesFirst);
        }
        // If transitioning to !particlesFirst
        if (!particlesFirst && prevParticlesFirst) {
            console.log("Transitioning to !particlesFirst", id);
        }
    }, [particlesFirst]);

    const inOutIndices = () => {
        const inIndex = 0
        const outIndex = (node.childrenIds.length >1) ? 1 : 0;
        return { inIndex, outIndex };
    };

    // Passing down the joints through CompoundEntity
    useEffect(() => {
        const { inIndex, outIndex } = inOutIndices();
        const inNode = entityNodes[inIndex];
        const outNode = entityNodes[outIndex];
        jointsFromRef.current[outNode.id] = props.jointsFrom;
        jointsToRef.current[inNode.id] = props.jointsTo;
    }, []);

    // Only need to do this if entity is a Particle ?
    useEffect(() => {
        console.log("particlesFirstDelayed", particlesFirstDelayed)
        if (!particlesFirstDelayed) {
            //console.log("Map jointsTo", id, props.jointsTo, jointsToRef.current);
            //console.log("Map jointsFrom", id, props.jointsFrom, jointsFromRef.current);
            const { inIndex, outIndex } = inOutIndices();
            const inNode = directGetNode(entitiesToInstantiate[inIndex]);
            const outNode = directGetNode(entitiesToInstantiate[outIndex])
            const inNodeQuaternion = entityOrientationsRef.current[inNode.id];
            inNodeQuaternion.invert();
            const outNodeQuaternion = entityOrientationsRef.current[outNode.id];
            outNodeQuaternion.invert();

            // The rotation of the old body may no longer be relevant because of CompoundEntity rotation

            if (jointsToInRef.current) {
                console.log("jointsTo", id, jointsToInRef.current, directGetJoints());
                const jointsUpdated = [];
                jointsToInRef.current.forEach((jointId, i) => {
                    console.log("jointsTo jointId", node.depth, jointId);
                    const [jointRef, body1Id, body2Id] = directGetJoint(jointId);
                    console.log("jointsTo body1Id, inNode.id", body1Id, inNode.id)
                    const body1Ref = directGetNode(body1Id).ref;
                    console.log("Map jointsTo", node.depth, id, jointId, `${body1Id}-${inNode.id}`, quaternion);
                    // Radius needs to be fetched
                    // Instead of calculating angle keep the previous angle to maintian shape
                    // Copy the angle from body1 and transfer the angle from body2 to in Node ?
                    // But we are not using the jointRef (it may not be stable?)
                    const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref.current, inNode.ref.current, entityRadius);
                    console.log("jointsTo offset1, offset2", offset1, offset2)
                    // Replace body
                    updateJoint(node.chainRef, jointId, body1Ref.current, offset1, inNode.ref.current, offset2);
                    jointsUpdated.push(jointId);
                });
                jointsToInRef.current = jointsToInRef.current.filter((jointId) => !jointsUpdated.includes(jointId));
            }
            if (jointsFromInRef.current) {
                console.log("jointsFrom", id, jointsFromInRef.current, directGetJoints());
                const jointsUpdated = [];
                jointsFromInRef.current.forEach((jointId, i) => {
                    console.log("jointsFrom jointId", node.depth, jointId);
                    const [jointRef, body1Id, body2Id] = directGetJoint(jointId);
                    const body2Ref = directGetNode(body2Id).ref;
                    console.log("Map jointsFrom", node.depth, id, jointId, `${outNode.id}-${body2Id}`, quaternion);
                    // Radius needs to be fetched
                    const { offset1, offset2 } = utils.calculateJointOffsets(outNode.ref.current, body2Ref.current, entityRadius);
                    console.log("jointsFrom offset1, offset2", offset1, offset2)
                    // Replace body
                    updateJoint(node.chainRef, jointId, outNode.ref.current, offset1, body2Ref.current, offset2);
                    jointsUpdated.push(jointId);
                });
                jointsFromInRef.current = jointsFromInRef.current.filter((jointId) => !jointsUpdated.includes(jointId));
            }
            if (jointsToInRef.current.length || jointsFromInRef.current.length) {
                setTriggerJoints(!triggerJoints);
                //setParticlesFirstDelayed(false);
                console.log("setTriggerJoints", id);
            } else {
                setJointsMapped(true);
                console.log("Set jointsMapped to true", id);
            }
        }
    }, [particlesFirstDelayed, triggerJoints]);

    // Need particles[i].current.getVisualConfig().outerChain

    const instantiateEntity = (entityNodeId, i) => {
        console.log("instantiateEntity", id, entityNodeId, i);
        // Strip out any id from entitiesToInstantiate that is not in entityNodes and add next entity
        setEntitiesToInstantiate(p => [...p.filter(id => node.childrenIds.includes(id)), entityNodeId]);
        //const newPosition = node.childrenIds.length > 0 ? [0, 0, 0] : [...initialPosition];
        //const newPosition = [...initialPosition];
        const newPosition = [0, 0, 0];
        // Not doing anything with i = 0 yet
        switch (i) {
            case 0:
                if (node.childrenIds.length > 1) {
                    newPosition[0] -= entityRadius;
                    //perpendicular(newPosition, quaternion);
                }
                setInstantiateJoints(p => [...p, [null, null]]);
                break;
            case 1: {
                newPosition[0] += entityRadius;
                // perpendicular to quaternion 
                //perpendicular(newPosition, quaternion);
                setInstantiateJoints(p => [...p, [entityNodes[0].id, entityNodes[1].id], [entityNodes[1].id, entityNodes[0].id]]);
                break;
            }
            case 2: {
                newPosition[1] -= entityRadius * Math.sqrt(3);
                //perpendicular(newPosition, quaternion);
                const replaceJointId = activeJointsQueueRef.current[0];
                // Scale up the joint to use setReplaceJointWith
                const [jointRef, body1Id, body2Id] = directGetJoint(replaceJointId);
                const joint = jointRef.current;
                const scaleAnchor = (anchor) => ({
                    x: anchor.x * scaleJoint,
                    y: anchor.y * scaleJoint,
                    z: anchor.z * scaleJoint,
                });
                joint.setAnchor1(scaleAnchor(joint.anchor1()));
                joint.setAnchor2(scaleAnchor(joint.anchor2()));
                setReplaceJointWith(p => [...p, entityNodes[i].id]);
                break;
            }
            case 3: {
                newPosition[1] += entityRadius * Math.sqrt(3);
                //perpendicular(newPosition, quaternion);
                const replaceJointId = activeJointsQueueRef.current[0];
                // Scale up the joint to use setReplaceJointWith
                const [jointRef, body1Id, body2Id] = directGetJoint(replaceJointId);
                const joint = jointRef.current;
                const scaleAnchor = (anchor) => ({
                    x: anchor.x * scaleJoint,
                    y: anchor.y * scaleJoint,
                    z: anchor.z * scaleJoint,
                });
                joint.setAnchor1(scaleAnchor(joint.anchor1()));
                joint.setAnchor2(scaleAnchor(joint.anchor2()));
                setReplaceJointWith(p => [...p, entityNodes[i].id]);
                break;
            }
            default: {
                // Should be the joint that is being replaced - first need to widen the joint
                const replaceJointId = activeJointsQueueRef.current[0];
                console.log("replaceJointId", replaceJointId, i);

                const [jointRef, body1Id, body2Id] = directGetJoint(replaceJointId);
                const joint = jointRef.current;
                const scaleAnchor = (anchor) => ({
                    x: anchor.x * scaleJoint,
                    y: anchor.y * scaleJoint,
                    z: anchor.z * scaleJoint,
                });
                joint.setAnchor1(scaleAnchor(joint.anchor1()));
                joint.setAnchor2(scaleAnchor(joint.anchor2()));

                function calculateOptimalCircleRadius(n, entityRadius) {
                    const theta = (2 * Math.PI) / n;
                    return entityRadius / Math.sin(theta / 2);
                }

                if (coreActive) {
                    const optimalRadius = calculateOptimalCircleRadius(entitiesToInstantiate.length + 1, entityRadius);
                    coreColliderRef.current.setRadius(optimalRadius - entityRadius);
                }
                
                // Find the midpoint between the two nodes
                // Would be better to calculate midpoint at the time of instantiation after the joint has grown
                const node1 = directGetNode(body1Id);
                const node2 = directGetNode(body2Id);
                const body1Ref = node1.ref.current;
                const body2Ref = node2.ref.current;
                // Create the particle in the middle and let the joints "pull" it into place.
                const midpoint = utils.calculateMidpoint(body1Ref, body2Ref);
                nodeRef.current.worldToLocal(midpoint);
                console.log("midpoint", id, i, midpoint, body1Ref.translation(), body2Ref.translation());
                newPosition[0] = midpoint.x;
                newPosition[1] = midpoint.y;
                newPosition[2] = midpoint.z;
                setReplaceJointWith(p => [...p, entityNodes[i].id]);
                break;
            }
        }
        entityPositionsRef.current.push(newPosition);
        console.log("newPosition", newPosition, radius);
        
        const entityOrientation = centerRef.current.clone()
        entityOrientation.sub(new THREE.Vector3(...entityPositionsRef.current[i]));
        // Check if the resultant vector is zero
        if (entityOrientation.lengthSq() === 0) {
            // If zero vector, set to default direction
            entityOrientation.set(1, 0, 0);
        } else {
            // Otherwise, normalize the vector to turn it into a unit vector
            entityOrientation.normalize();
        }
        const forward = new THREE.Vector3(1, 0, 0); 
        let entityInitialQuaternion = new THREE.Quaternion(); 
        // if vectors are directly opposite, the resulting quaternion can cause a flip that affects other axes than intended.
        if (forward.dot(entityOrientation) === -1) {
            // Vectors are opposite, manually create quaternion for 180-degree rotation around the Z-axis
            entityInitialQuaternion.set(0, 0, 1, 0);  // Rotate 180 degrees around the Z-axis
            console.log("entityInitialQuaternion Rotate 180 degrees around the Z-axis")
        } else {
            // Use setFromUnitVectors if not directly opposite
            entityInitialQuaternion.setFromUnitVectors(forward, entityOrientation);
        }
        console.log("entityInitialQuaternion", entityNodeId, entityInitialQuaternion, quaternion);
        entityOrientationsRef.current[entityNodeId] = entityInitialQuaternion;

        console.log("Instantiating entityNodeId", id, i, entitiesToInstantiate, entityNodeId, newPosition);
    }

    // This will cause a render on each change of entitiesToInstantiate, adding one entity at a time
    useEffect(() => {
        if (busyInstantiatingRef.current) return;
        for (let i = 0; i < entityNodes.length; i++) {
            const entityNodeId = entityNodes[i].id;
            if (entitiesToInstantiate.includes(entityNodeId)) continue;
            busyInstantiatingRef.current = true;
            instantiatingIdRef.current = entityNodeId;

            // Define the node as outer or not for the blob 
            // both input and output are outer
            let outer = node.id === "root" ? true: false;
            if (i == 1 || i == 2 ) {
                outer = true;
            }
            // If instantiateCount is odd then outer is true
            if (i % 2 == 0) {
                outer = true;
            }
            const newOuter = {...parentOuter, [node.depth]: outer};
            outerNodesRef.current[entityNodeId] = newOuter;

            // Use a timer for a delay so we can see the sequence for debug etc 
            const delay = (i === 0) ? 0 : animDelay;
            setTimeout(() => {
                instantiateEntity(entityNodeId, i);
            }, delay);
            // This is a hack for now as we should check that deeper levels are ready first
            // Probably just check if all children are ready (rather than all particles)
            if (physicsState !== "ready") {
                setPhysicsState("ready");
            }
            // Add one entity at a time
            break;
        }
    }, [entityInstantiated, entityNodes]);

    useEffect(() => {
        setTimeout(() => {
            setEntitiesReadyDelayed(entitiesReady);
        }, animDelay);
    }, [entitiesReady]);

    useEffect(() => {
        setTimeout(() => {
            setParticlesFirstDelayed(particlesFirst);
        }, animDelay);
    }, [particlesFirst]);

    // Create a new joint connecting entities that are already connected
    // We know this is only used for when tere are 2 entities
    function instatiateJoints() {
        const instantiatedJointsIndices = [];
        console.log("instantiateJoints", instantiateJoints)
        instantiateJoints.forEach(([id1, id2], i) => {
            if (id1 === null && id2 === null) {
                instantiatedJointsIndices.push(i);
                return; // special case for first entity - no joint to create for now
            }
            const node1 = directGetNode(id1);
            const node2 = directGetNode(id2);
            const body1Ref = node1.ref.current;
            const body2Ref = node2.ref.current;
            if (!body1Ref?.current || !body2Ref?.current) return;
            // Should deal with different radius
            //const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref, body2Ref, entityRadius, entityOrientationsRef.current[id1], entityOrientationsRef.current[id2]);
            const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref, body2Ref, entityRadius);
            //const offset1 = new THREE.Vector3(entityRadius, 0, 0);
            //const offset2 = new THREE.Vector3(entityRadius, 0, 0);
            createJoint(node.chainRef, body1Ref, offset1, body2Ref, offset2);
            const jointId = utils.jointId(id1, id2);
            console.log("offsets", jointId, offset1, offset2);
            if (jointsFromRef.current[id1]) {
                jointsFromRef.current[id1].push(jointId);
            } else {
                jointsFromRef.current[id1] = [jointId];
            }
            if (jointsToRef.current[id2]) {
                jointsToRef.current[id2].push(jointId);
            } else {
                jointsToRef.current[id2] = [jointId];
            }
            activeJointsQueueRef.current.push(jointId);
            instantiatedJointsIndices.push(i);
        });
        return instantiatedJointsIndices;
    }

    useEffect(() => {
        if (!instantiateJoints.length) return;
        const instantiatedJointsIndices = instatiateJoints();
        // Filter out indices that have already been processed
        setInstantiateJoints(p => p.filter((_, i) => !instantiatedJointsIndices.includes(i)));
    }, [instantiateJoints]);

    // Replace a joint with a new entity and two joints
    function replaceJoint() {
        const replacedJointIndices = [];
        // Replace a joint with a new entity and connect that entity
        replaceJointWith.forEach((nextId, i) => {
            console.log("replaceJoint", nextId);
            const nextEntity = directGetNode(nextId);
            const nextBodyRef = nextEntity.ref.current;
            if (!nextBodyRef?.current) return;

            const replaceJointId = activeJointsQueueRef.current[0];

            const [jointRef, body1Id, body2Id] = directGetJoint(replaceJointId);
            const anchor1 = vec3(jointRef.current.anchor1());
            const anchor2 = vec3(jointRef.current.anchor2());

            const node1 = directGetNode(body1Id);
            const node2 = directGetNode(body2Id);
            const body1Ref = node1.ref.current;
            const body2Ref = node2.ref.current;

            anchor1.multiplyScalar(1 / scaleJoint);
            anchor2.multiplyScalar(1 / scaleJoint);
            createJoint(node.chainRef, body1Ref, anchor1, nextBodyRef, anchor2);
            // This is not ideal we are creaeting the joint1Id, would be better if createJoint returned it.
            const joint1Id = utils.jointId(body1Id, nextEntity.id);
            if (jointsFromRef.current[body1Id]) {
                jointsFromRef.current[body1Id].push(joint1Id);
            } else {
                jointsFromRef.current[body1Id] = [joint1Id];
            }
            if (jointsToRef.current[nextEntity.id]) {
                jointsToRef.current[nextEntity.id].push(joint1Id);
            } else {
                jointsToRef.current[nextEntity.id] = [joint1Id];
            }
            activeJointsQueueRef.current.push(joint1Id);

            createJoint(node.chainRef, nextBodyRef, anchor1, body2Ref, anchor2);
            const joint2Id = utils.jointId(nextEntity.id, body2Id);
            if (jointsFromRef.current[nextEntity.id]) {
                jointsFromRef.current[nextEntity.id].push(joint2Id);
            } else {
                jointsFromRef.current[nextEntity.id] = [joint2Id];
            }
            if (jointsToRef.current[body2Id]) {
                jointsToRef.current[body2Id].push(joint2Id);
            } else {
                jointsToRef.current[body2Id] = [joint2Id];
            }
            activeJointsQueueRef.current.push(joint2Id);

            deleteJoint(node.chainRef, replaceJointId);
            if (jointsFromRef.current[body1Id]) {
                jointsFromRef.current[body1Id] = jointsFromRef.current[body1Id].filter((jointId) => jointId !== replaceJointId);
            }
            if (jointsToRef.current[body2Id]) {
                jointsToRef.current[body2Id] = jointsToRef.current[body2Id].filter((jointId) => jointId !== replaceJointId);
            }
            console.log("deleteJoint jointsFromRef", replaceJointId, JSON.stringify(jointsFromRef.current));
            console.log("deleteJoint jointsToRef", replaceJointId, JSON.stringify(jointsToRef.current));
            activeJointsQueueRef.current.shift();
            console.log("deleteJoint activeJointsQueueRef", replaceJointId, JSON.stringify(activeJointsQueueRef.current));
            jointsFromInRef.current = jointsFromInRef.current.filter((jointId) => jointId !== replaceJointId);
            jointsToInRef.current= jointsToInRef.current.filter((jointId) => jointId !== replaceJointId);
            replacedJointIndices.push(i);

            if (false && coreActive) {
                const { offset1, offset2 } = utils.calculateJointOffsets(coreColliderRef.current, nextBodyRef.current, entityRadius);
                world.createImpulseJoint(
                    rapier.JointData.spherical(offset1, offset2),
                    coreColliderRef.current,
                    nextBodyRef.current,
                    true
                );
            }
        });

        return replacedJointIndices;
    }

    useEffect(() => {
        if (!replaceJointWith.length) return;
        const replacedJointIndices = replaceJoint();
        // Filter out indices that have already been processed
        setReplaceJointWith(p => p.filter((_, i) => !replacedJointIndices.includes(i)));
    }, [replaceJointWith]);

    useEffect(() => {
        if (!particlesFirstDelayed && !entitiesReady && jointsMapped) {
            const firstEntity = directGetNode(entitiesToInstantiate[0]);
            //console.log("lockTranslations", firstEntity.ref.current);
            //firstEntity.ref.current.current.lockTranslations(false, true);
            //firstEntity.ref.current.current.lockRotations(false, true);
            // Can update all the initial positions
            for (let i = 0; i < entitiesToInstantiate.length; i++) {
                const entityId = entitiesToInstantiate[i];
                if (!particleReady[entityId]) {
                    setTimeout(() => {
                        setParticleReady({ ...particleReady, [entityId]: true });
                        const entityNode = directGetNode(entityId);
                        const newPosition = entityNode.ref.current.getCenter()
                        entityPositionsRef.current[i] = newPosition;
                    }, animDelay);
                    break;
                }
            }
        }
    }, [particleReady, particlesFirstDelayed, jointsMapped]);

    useFrame(() => {

        calculateCenter({
            getNode: directGetNode,
            items: entitiesToInstantiate,
            centerRef: centerRef,
        });
        nodeRef.current.setCenter(centerRef.current);
        calculateCenter({
            getNode: directGetNode,
            items: entitiesToInstantiate,
            centerRef: worldCenterRef,
            useWorld: true,
        });

        if (busyInstantiatingRef.current) {
            const lastEntity = directGetNode(instantiatingIdRef.current);
            // Is the rigid body reference available
            const particleRef = lastEntity.ref;
            const instantiatedCount = entitiesToInstantiate.length;
            if (particleRef?.current?.current) {
                console.log("Ready", lastEntity.id, lastEntity);
                setEntityInstantiated(lastEntity.id);
                busyInstantiatingRef.current = false;
                if (instantiatedCount == 1) {
                    //particleRef.current.current.lockTranslations(true, true);
                    //particleRef.current.current.lockRotations(true, true);
                }
                if (instantiatedCount == entityCount && particlesFirst) {
                    const firstEntity = directGetNode(entitiesToInstantiate[0]);
                    firstEntity.ref.current.current.lockTranslations(false, true);
                    firstEntity.ref.current.current.lockRotations(false, true);
                    setParticlesFirst(false);
                }
                node.particlesRef.current.push(particleRef);
                // If we have a shape then update the joints with new angles to allow for change in the number of entities
                if (instantiatedCount > 2) {
                    console.log("directGetJoints", directGetJoints())
                    // Calculate newJointAngle based on the sum of internal angles of a polygon, dividing it equally among vertices
                    alignJointsToPolygon();
                }

                // Blob is called for root before the particles are ready at the lowest level 
                // entitiesReadyDelayed is not sufficient for that

                
            }
        }

        if (!particlesFirstDelayed && !entitiesReady) {
            let ready = true;
            // Check that all entities have refs
            for(let i = 0; i < entityNodes.length; i++) {
                const entity = entityNodes[i];
                if (!entity.ref.current || ! entity.ref.current.current || !particleReady[entity.id]) {
                    ready = false;
                    //console.log("no entity", id, entity)
                    break;
                } else {
                    //console.log("entity", id, utils.stringifyCircular(entity.ref.current))
                }
            }
            if (ready) {
                setEntitiesReady(true);
                // So we update the blob info
                directResetParticlesStable();
            }
        }

        if (!particlesFirstDelayed && !coreActive && entitiesReady) {
            let allParticles = true;
            for (let i = 0; i < entityNodes.length; i++) {
                const entity = entityNodes[i];
                if (entity.childrenIds.length > 0) {
                    allParticles = false;
                    break;
                }
            }
            if (allParticles) {
                //createCore();
            }
        }

        if (coreActive && !initiatedCore && coreColliderRef.current) {
            const corePosition = coreColliderRef.current.translation();
            const coreRotation = quat(coreColliderRef.current.rotation());
            const coreQuaternion = coreRotation.invert();
            const joints = [];
            for (let i = 0; i < 3; i++) {
                const entityId = entitiesToInstantiate[i];
                const entityNode = directGetNode(entityId);
                console.log("initiate core", id, entitiesToInstantiate[i], coreColliderRef.current, entityNode.ref.current.current);
                
                const coreRadius = coreColliderRef.current.radius();
                const bodyPosition = entityNode.ref.current.current.translation();
                
                // Calculate the direction vector and distance
                const direction = new THREE.Vector3().subVectors(bodyPosition, corePosition);
                //const distance = direction.length() - entityRadius;
                const distance = coreRadius
                direction.normalize();
                
                // Calculate anchor1 position
                const anchor1 = direction.clone().multiplyScalar(distance);
                
                // Apply inverse rotation to anchor1
                anchor1.applyQuaternion(coreQuaternion);
                
                // Define anchor2
                const anchor2 = { x: entityRadius, y: 0, z: 0 };

                joints.push([
                    rapier.JointData.spherical(anchor1, anchor2),
                    coreColliderRef.current,
                    entityNode.ref.current.current,
                    true
                ])
            }
            joints.forEach(joint =>
                world.createImpulseJoint(...joint)
            );
            setInitiatedCore(true);
        }
        

        function createCore() {
            calculateCenter({
                getNode: directGetNode,
                items: entitiesToInstantiate,
                centerRef: centerRef,
            });
            coreInitialPositionRef.current = centerRef.current;
            //console.log("centerRef.current", centerRef.current);
            setCoreActive(true);
        }

        function alignJointsToPolygon() {
            const sumInternal = (entitiesToInstantiate.length - 2) * 180;
            const newJointAngle = sumInternal / entitiesToInstantiate.length / 2;

            // Because we use a clockwise direction for joints angle1 is positive, angle2 is negative
            const angle1 = THREE.MathUtils.degToRad(-newJointAngle);
            const angle2 = THREE.MathUtils.degToRad(newJointAngle);

            // For each end of each joint rotate it to match with  newJointAngle
            activeJointsQueueRef.current.forEach((jointId, i) => {
                const [jointRef, body1Id, body2Id] = directGetJoint(jointId);
                const joint = jointRef.current;

                if (!joint) {
                    console.warn("Joint not found", id, jointId);
                    return; // Joint is being modified and not yet ready
                }

                const anchor1 = vec3(joint.anchor1());
                const anchor2 = vec3(joint.anchor2());
                
                const radius1 = anchor1.length();
                const radius2 = anchor2.length();

                const newX1 = radius1 * Math.cos(angle1);
                const newY1 = radius1 * Math.sin(angle1);
                const newX2 = radius2 * Math.cos(angle2);
                const newY2 = radius2 * Math.sin(angle2);

                const newAnchor1 = new THREE.Vector3(newX1, newY1, 0);
                const newAnchor2 = new THREE.Vector3(newX2, newY2, 0);

                const node1 = directGetNode(body1Id);
                const node2 = directGetNode(body2Id);
                const quaternion1 = quat(node1.ref.current.rotation());
                const quaternion2 = quat(node2.ref.current.rotation());

                //newAnchor1.applyQuaternion(quaternion1);
                //newAnchor2.applyQuaternion(quaternion2);

                joint.setAnchor1(newAnchor1);
                joint.setAnchor2(newAnchor2);
            });
        }

    });

    useFrame(() => {
        if (entityCount == 0) return;
        // State machine can distribute computation across frames, reducing load on the physics engine
        switch (frameStateRef.current) {
            case "init":
                // useEffect to call initializeJoints because it may take longer than a frame
                // particleChange is global in storeEntity but cleared 
                // Should only chek it from root ? But need a better fix
                // chainRef is not built ?
                // createJoint and updateJoint need to maintain chainRef
                if (!allParticlesReady) {
                    const allParticleRefs = directGetAllParticleRefs(id);
                    //console.log("allParticleRefs", id, allParticleRefs); // empty
                    if (allParticleRefs.length >= node.childrenIds.length) {
                        //console.log("allParticleRefs.length", id, allParticleRefs.length)
                        let particlesExist = true;
                        allParticleRefs.forEach((particleRef) => {
                            if (!particleRef.current) {
                                particlesExist = false;
                            }
                        });
                        //if (particlesExist) setPhysicsState("initialize");
                        if (particlesExist) {
                            setAllParticlesReady(true);
                            console.log("allParticlesReady", id, allParticleRefs);
                        }
                    }
                } else {
                    if (id == "root") {
                        console.log("Physics ready", nodeRef);
                        console.log("useStoreEntity", useStoreEntity.getState());
                        nodeRef.current.setVisualConfig(p => ({ ...p, visible: true }));
                    }
                    frameStateRef.current = "findCenter";
                }
                break;
            case "findCenter":
                calculateCenter({
                    items: entityNodes,
                    centerRef: centerRef,
                });
                nodeRef.current.setCenter(centerRef.current);
                break;
            default:
                console.error("Unexpected state", id, frameStateRef.current)
                break;
        }
    });

    //console.log("CompoundEntity rendering", id, "node", node, "entityCount", entityCount, "entityNodes", entityNodes)
    //useWhyDidYouUpdate(`CompoundEntity ${id}`, {id, initialPosition, radius, debug, color, index, config, node, entityNodes, entitiesToInstantiate} );

    //<CompoundEntityGroup ref={nodeRef} position={initialPosition} initialQuaternion={quaternion}>

    return (
        <group>
             <CompoundEntityGroup ref={nodeRef} position={initialPosition} initialQuaternion={quaternion}>
                {entitiesToInstantiate.map((entityId, i) => {
                    let entity = directGetNode(entityId);
                    let EntityType = CompoundEntity;
                    if (entity.childrenIds.length === 0) {
                        EntityType = Particle;
                    } else if (particlesFirstDelayed) {
                        EntityType = Particle;
                    } else if (!particleReady[entityId]) {
                        EntityType = Particle;
                    }
                    //console.log("EntityType", entity.id, entity.childrenIds.length === 0, particlesFirstDelayed, !particleReady[entityId])
                    return (
                        <EntityType
                            key={`${id}-${i}`}
                            id={`${entity.id}`}
                            initialPosition={entityPositionsRef.current[i]}
                            radius={entityRadius}
                            color={localColor}
                            ref={entity.ref}
                            debug={isDebug}
                            config={config}
                            index={`${i}`}
                            entitiesReady={entitiesReadyDelayed}
                            jointsTo={jointsToRef.current[entity.id] || []}
                            jointsFrom={jointsFromRef.current[entity.id] || []}
                            initialQuaternion={entityOrientationsRef.current[entity.id]}
                            parentOuter={outerNodesRef.current[entity.id]}
                        />
                    )
                })}

                {coreActive && (
                    <RigidBody
                        ref={coreRef}
                        position={coreInitialPositionRef.current}
                        type={"dynamic"}
                        //type={"fixed"}
                        colliders={false}
                        enabledTranslations={[true, true, false]}
                        enabledRotations={[false, false, true]}
                    >
                        <BallCollider ref={coreColliderRef} args={[entityRadius * 0.1]} />
                    </RigidBody>
                )}

                {allParticlesReady && (
                    <Blob
                        color={localColor}
                        node={node}
                        centerRef={centerRef}
                        entityNodes={entityNodes}
                    />
                )}
                {isDebug && (
                    <DebugRender
                        id={id}
                        radius={radius}
                        color={localColor}
                        initialPosition={initialPosition}
                        newJointsRef={node.jointsRef}
                        index={index || 0}
                        nodeRef={nodeRef}
                        isDebug={isDebug}
                        centerRef={centerRef}
                    />
                )}
            </CompoundEntityGroup>
            {physicsState === "ready" && node.depth === 0 && (
                <group>
                    <ParticlesInstance
                        id={`${id}`}
                        node={node}
                        ref={particlesInstanceRef}
                    />
                    {config.showRelations && (
                        <Relations
                            id={`${id}`}
                            node={node}
                        />
                    )}
                </group>
            )}
            {isDebug && (
                <Text
                    position={[initialPosition[0], initialPosition[1], 0.1]}
                    fontSize={radius / 2}
                    color="black"
                    anchorX="center"
                    anchorY="middle"
                >
                    {index || 0}
                </Text>
            )}
        </group>
    );

}));

export default CompoundEntity;

const calculateCenter = ({ getNode, items, centerRef, useWorld = false }) => {
    centerRef.current.set(0, 0, 0); // Reset the center vector
    let activeEntities = 0;

    items.forEach((item) => {
        let entityNode;

        // Check if the item is an ID or a node object and get the node accordingly
        if (typeof item === 'string' || typeof item === 'number') {
            entityNode = getNode(item);
        } else {
            entityNode = item;
        }

        // Continue if the entity node and its reference are valid
        if (entityNode && entityNode.ref.current) {
            // Decide whether to use world or local center based on the 'useWorld' flag
            const method = useWorld ? 'getCenterWorld' : 'getCenter';
            const entityCenter = entityNode.ref.current[method]();
            if (entityCenter) {
                centerRef.current.add(entityCenter);
                activeEntities++;
            }
        }
    });

    if (activeEntities > 0) {
        centerRef.current.divideScalar(activeEntities);
    }
};

function perpendicular(newPosition, quaternion) {
    const newPositionVector3 = new THREE.Vector3().fromArray(newPosition);
    newPositionVector3.applyQuaternion(quaternion);
    const perpendicular = new THREE.Quaternion();
    perpendicular.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2); // 90 degrees around Z axis
    newPositionVector3.applyQuaternion(perpendicular);
    newPosition[0] = newPositionVector3.x;
    newPosition[1] = newPositionVector3.y;
    newPosition[2] = newPositionVector3.z;
}

