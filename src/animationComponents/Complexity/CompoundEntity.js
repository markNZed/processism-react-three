import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Circle } from '@react-three/drei';
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

// Priorities refactoring
//   

const CompoundEntity = React.memo(React.forwardRef(({ id, initialPosition = [0, 0, 0], radius, debug, color, config, outer = {}, ...props }, ref) => {

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

    // This allows us to pause the physics simulation
    const setOption = useStore((state) => state.setOption);
    const getOption = useStore((state) => state.getOption);
    //if (!getOption("pausePhysics")) setOption("pausePhysics", true);

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
    // Block the instantiating of next entity
    const busyInstantiatingRef = useRef(false);
    const instantiatingIdRef = useRef();
    const [instantiateJoints, setInstantiateJoints] = useState([]);
    const activeJointsQueueRef = useRef([]);
    const [replaceJointWith, setReplaceJointWith] = useState([]);
    const [entityInstantiated, setEntityInstantiated] = useState();
    const [entitiesReady, setEntitiesReady] = useState(false);
    const [entitiesReadyDelayed, setEntitiesReadyDelayed] = useState(false);
    const [particlesFirst, setParticlesFirst] = useState(true);
    const [prevParticlesFirst, setPrevParticlesFirst] = useState(true);
    const [particlesFirstDelayed, setParticlesFirstDelayed] = useState(true);
    const jointsFromRef = useRef({});
    const jointsToRef = useRef({});
    const scaleJoint = 2.1; // Slightly bigger to avoid "hitting" the surrounding particles
    const quaternion = props.initialQuaternion || new THREE.Quaternion();
    const jointsToInRef = useRef(props.jointsTo || []);
    const jointsFromInRef = useRef(props.jointsFrom || []);
    const [particleReady, setParticleReady] = useState({});
    const [jointsMapped, setJointsMapped] = useState(true);
    const [triggerJoints, setTriggerJoints] = useState(false);
    const particlesInstanceRef = useRef();
    const animDelay = 250;
    const [allParticlesReady, setAllParticlesReady] = useState(false);
    const outerRef = useRef({});
    const inIndex = 0;
    const outIndex = (entityCount == 1) ? 0 : 1;
    const FORWARD = new THREE.Vector3(1, 0, 0);
    const entityInitialQuaternion = new THREE.Quaternion(); 

    const entityPoseRef = useRef({
        positions: [],
        orientations: {},
    });

    const { deleteJoint, createJoint, updateJoint, addLink } = useJoints();

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
        if (particlesFirst !== prevParticlesFirst) { 
            setPrevParticlesFirst(particlesFirst);
        }
        // If transitioning to !particlesFirst
        if (!particlesFirst && prevParticlesFirst) {
            console.log("Transitioning to !particlesFirst", id);
        }
    }, [particlesFirst]);


    // Passing down the joints through CompoundEntity
    useEffect(() => {
        const inNode = entityNodes[inIndex];
        const outNode = entityNodes[outIndex];
        // Transfer joints from parent entity
        jointsFromRef.current[outNode.id] = props.jointsFrom;
        jointsToRef.current[inNode.id] = props.jointsTo;
    }, []);

    // Only need to do this if entity is a Particle ?
    useEffect(() => {

        function processJoints(jointsRef, newNodeId, isTo) {
            const jointsUpdated = [];
            jointsRef.current.forEach(jointId => {
                const [jointRef, body1Id, body2Id] = directGetJoint(jointId);
                const node1Ref = isTo ? directGetNode(body1Id).ref : directGetNode(newNodeId).ref;
                const node2Ref = isTo ? directGetNode(newNodeId).ref : directGetNode(body2Id).ref;
                const visualConfig1 = node1Ref.current.getVisualConfig();
                const visualConfig2 = node2Ref.current.getVisualConfig();
                const radius1 = visualConfig1.radius;
                const radius2 = visualConfig2.radius;
                const { offset1, offset2 } = utils.calculateJointOffsets(node1Ref.current, node2Ref.current, radius1, radius2);
                updateJoint(node.chainRef, jointId, node1Ref.current, offset1, node2Ref.current, offset2);
                jointsUpdated.push(jointId);
            });
            jointsRef.current = jointsRef.current.filter(jointId => !jointsUpdated.includes(jointId));
        }

        if (!particlesFirstDelayed) {
            processJoints(jointsToInRef, entitiesToInstantiate[inIndex], true);
            processJoints(jointsFromInRef, entitiesToInstantiate[outIndex], false);
            
            if (jointsToInRef.current.length || jointsFromInRef.current.length) {
                // Do we need this now ?
                setTriggerJoints(!triggerJoints);
                console.log("setTriggerJoints", id);
            } else {
                setJointsMapped(true);
                console.log("Set jointsMapped to true", id);
            }
        }
    }, [particlesFirstDelayed, triggerJoints]);

    // Scale up the joint to use setReplaceJointWith
    function expandJoint() {
        const replaceJointId = activeJointsQueueRef.current[0];
        const [jointRef, body1Id, body2Id] = directGetJoint(replaceJointId);
        const joint = jointRef.current;
        const scaleAnchor = (anchor) => ({
            x: anchor.x * scaleJoint,
            y: anchor.y * scaleJoint,
            z: anchor.z * scaleJoint,
        });
        joint.setAnchor1(scaleAnchor(joint.anchor1()));
        joint.setAnchor2(scaleAnchor(joint.anchor2()));
    }

    const instantiateEntity = (entityNodeId, i) => {
        console.log("instantiateEntity", id, entityNodeId, i);
        // Strip out any id from entitiesToInstantiate that is not in entityNodes and add next entity
        setEntitiesToInstantiate(p => [...p.filter(id => node.childrenIds.includes(id)), entityNodeId]);
        const newPosition = [0, 0, 0];
        switch (i) {
            case 0:
                if (entityCount > 1) {
                    newPosition[0] -= entityRadius;
                }
                break;
            case 1: {
                newPosition[0] += entityRadius;
                setInstantiateJoints(p => [...p, [entityNodes[0].id, entityNodes[1].id], [entityNodes[1].id, entityNodes[0].id]]);
                break;
            }
            case 2: {
                newPosition[1] -= entityRadius * Math.sqrt(3);
                expandJoint();
                setReplaceJointWith(p => [...p, entityNodes[i].id]);
                break;
            }
            case 3: {
                newPosition[1] += entityRadius * Math.sqrt(3);
                expandJoint();
                setReplaceJointWith(p => [...p, entityNodes[i].id]);
                break;
            }
            default: {
                expandJoint();
                // Find the midpoint between the two nodes
                // Would be better to calculate midpoint at the time of instantiation after the joint has expanded
                const node1 = directGetNode(body1Id);
                const node2 = directGetNode(body2Id);
                const body1Ref = node1.ref.current;
                const body2Ref = node2.ref.current;
                // Create the particle in the middle and let the joints "pull" it into place.
                const midpoint = utils.calculateMidpoint(body1Ref, body2Ref);
                nodeRef.current.worldToLocal(midpoint);
                console.log("midpoint", id, i, midpoint, body1Ref.translation(), body2Ref.translation());
                newPosition = [midpoint.x, midpoint.y, midpoint.z];
                setReplaceJointWith(p => [...p, entityNodes[i].id]);
                break;
            }
        }
        entityPoseRef.current.positions.push(newPosition);
        
        const entityOrientation = centerRef.current.clone()
        entityOrientation.sub(new THREE.Vector3(...entityPoseRef.current.positions[i]));
        // If zero vector, set to default direction
        if (entityOrientation.lengthSq() === 0) {
            entityOrientation.set(1, 0, 0);
        } else {
            entityOrientation.normalize();
        }
        // If vectors are directly opposite, the resulting quaternion can cause a flip that affects other axes than intended.
        if (FORWARD.dot(entityOrientation) === -1) {
            // Vectors are opposite, manually create quaternion for 180-degree rotation around the Z-axis
            entityInitialQuaternion.set(0, 0, 1, 0);
        } else {
            entityInitialQuaternion.setFromUnitVectors(FORWARD, entityOrientation);
        }
        entityPoseRef.current.orientations[entityNodeId] = entityInitialQuaternion;

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
            let outerAtDepth = node.id === "root" ? true: false;
            if (i == 1 || i == 2 ) {
                outerAtDepth = true;
            }
            // If instantiateCount is odd then outerAtDepth is true
            if (i % 2 == 0) {
                outerAtDepth = true;
            }
            const newOuter = {...outer, [node.depth]: outerAtDepth};
            outerRef.current[entityNodeId] = newOuter;

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
            const node1 = directGetNode(id1);
            const node2 = directGetNode(id2);
            const body1Ref = node1.ref.current;
            const body2Ref = node2.ref.current;
            if (!body1Ref?.current || !body2Ref?.current) return;
            // Should deal with different radius
            //const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref, body2Ref, entityRadius, entityPoseRef.current.orientations[id1], entityPoseRef.current.orientations[id2]);
            const visualConfig1 = node1.ref.current.getVisualConfig();
            const body1radius = visualConfig1.radius;
            const visualConfig2 = node2.ref.current.getVisualConfig();
            const body2radius = visualConfig2.radius;
            const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref, body2Ref, body1radius, body2radius);
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
                        entityPoseRef.current.positions[i] = [newPosition.x, newPosition.y, newPosition.z];
                    }, animDelay);
                    break;
                }
            }
        }
    }, [particleReady, particlesFirstDelayed, jointsMapped]);

    const calculateCenter = ({ items }) => {
        worldCenterRef.current.set(0, 0, 0); // Reset the center vector
        let activeEntities = 0;
    
        items.forEach((item) => {
            let entityNode;
    
            // Check if the item is an ID or a node object and get the node accordingly
            if (typeof item === 'string' || typeof item === 'number') {
                entityNode = directGetNode(item);
            } else {
                entityNode = item;
            }
    
            // Continue if the entity node and its reference are valid
            if (entityNode && entityNode.ref.current) {
                // Decide whether to use world or local center based on the 'useWorld' flag
                const entityCenter = entityNode.ref.current.getCenterWorld();
                if (entityCenter) {
                    worldCenterRef.current.add(entityCenter);
                    activeEntities++;
                }
            }
        });
    
        if (activeEntities > 0) {
            worldCenterRef.current.divideScalar(activeEntities);
        }

        centerRef.current = nodeRef.current.worldToLocal(worldCenterRef.current.clone());

        nodeRef.current.setCenter(centerRef.current);
    
    };

    useFrame(() => {

        calculateCenter({
            items: entitiesToInstantiate,
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
                    //firstEntity.ref.current.current.lockTranslations(false, true);
                    //firstEntity.ref.current.current.lockRotations(false, true);
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

        if (!particlesFirstDelayed && entitiesReady) {
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
                /*
                calculateCenter({
                    items: entityNodes,
                    centerRef: centerRef,
                });
                nodeRef.current.setCenter(centerRef.current);
                */
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
             <CompoundEntityGroup ref={nodeRef} position={initialPosition} initialQuaternion={quaternion} id={id}>
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
                            initialPosition={entityPoseRef.current.positions[i]}
                            radius={entityRadius}
                            color={localColor}
                            ref={entity.ref}
                            debug={isDebug}
                            config={config}
                            entitiesReady={entitiesReadyDelayed}
                            jointsTo={jointsToRef.current[entity.id] || []}
                            jointsFrom={jointsFromRef.current[entity.id] || []}
                            initialQuaternion={entityPoseRef.current.orientations[entity.id]}
                            outer={outerRef.current[entity.id]}
                        />
                    )
                })}

                {allParticlesReady && (
                    <Blob
                        color={localColor}
                        node={node}
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
                    {id || 0}
                </Text>
            )}
        </group>
    );

}));

export default CompoundEntity;