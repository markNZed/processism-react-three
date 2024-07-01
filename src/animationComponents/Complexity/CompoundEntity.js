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

// EntityType is CompoundEntity for the first time and this causes issues for Rapier?

const CompoundEntity = React.memo(React.forwardRef(({ id, initialPosition = [0, 0, 0], radius, debug, color, index, config, ...props }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const nodeRef = useRef();
    useImperativeHandle(ref, () => nodeRef.current);
    //const { world, rapier } = useRapier();

    // Direct access to the state outside of React's render flow
    const {
        getNode: directGetNode,
        updateNode: directUpdateNode,
        getAllParticleRefs: directGetAllParticleRefs,
        getJoint: directGetJoint,
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
    //const entityRadius = config.radius / getNodeCount();
    const entityRadius = config.radius / 10 / (node.depth + 1); // Fixed to help with testing
    //const entityRadius = useMemo(() => Math.min(radius * Math.PI / (entityCount + Math.PI), radius / 2) * 0.97, [radius, entityCount]);
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
    const [coreActive, setCoreActive] = useState();
    const coreRef = useRef();
    const coreColliderRef = useRef();
    const coreInitialPositionRef = useRef();
    const axis = new THREE.Vector3(0, 0, 1); // 2D Axis

    // Layout to avoid Particle overlap (which can cause extreme forces in Rapier)
    //const entityPositions = useMemo(() => {
    //    return generateEntityPositions(radius - entityRadius, entityCount, initialPosition);
    //}, [radius, entityRadius, entityCount]);
    const entityPositionsRef = useRef([]);

    const { initializeJoints, deleteJoint, createJoint } = useJoints();

    //useAnimateImpulses(isPhysicsReady(), node, entityNodes, initialPosition, radius, config);
    useAnimateRelations(isPhysicsReady(), node, entityNodes, config);
    useAnimateJoints(isPhysicsReady(), node, entityNodes, deleteJoint, createJoint, config);

    useEffect(() => {
        directUpdateNode(id, { initialPosition });
        if (node.depth == 0) console.log(`Mounting CompoundEntity ${id} at depth ${node.depth}`);
        node.ref.current.setVisualConfig({ color: color, uniqueId: id, radius: radius });
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

    // Need particles[i].current.getVisualConfig().outerChain

    const instantiateEntity = (entityNodeId, i) => {
        // Strip out any id from entitiesToInstantiate that is not in entityNodes and add next entity
        setEntitiesToInstantiate(p => [...p.filter(id => node.childrenIds.includes(id)), entityNodeId]);
        const newPosition = [...initialPosition];
        // Not doing anything with i = 0 yet
        switch (i) {
            case 0:
                setInstantiateJoints(p => [...p, [null, null]]);
                break;
            case 1:
                setInstantiateJoints(p => [...p, [entityNodes[0].id, entityNodes[1].id]]);
                newPosition[0] += 2 * entityRadius;
                break;
            case 2:
                // Order is important, it must be clockwise
                setInstantiateJoints(p => [...p, [entityNodes[1].id, entityNodes[2].id], [entityNodes[2].id, entityNodes[0].id]]);
                newPosition[0] += entityRadius;
                newPosition[1] -= 2 * entityRadius;
                break;
            case 3: {
                const newJointPosition = false;
                setReplaceJointWith(p => [...p, [entityNodes[i].id, newJointPosition]]);
                const replaceJointId = activeJointsQueueRef.current[0];

                // Scale up the joint to use setReplaceJointWith
                const [jointRef, body1Id, body2Id] = directGetJoint(replaceJointId);
                const joint = jointRef.current;
                const scaleAnchor = (anchor) => ({
                    x: anchor.x * 2,
                    y: anchor.y * 2,
                    z: anchor.z * 2,
                });
                joint.setAnchor1(scaleAnchor(joint.anchor1()));
                joint.setAnchor2(scaleAnchor(joint.anchor2()));
                
                newPosition[0] += entityRadius;
                newPosition[1] += 2 * entityRadius;
                break;
            }
            default: {
                setReplaceJointWith(p => [...p, [entityNodes[i].id, false]]);
                // Should be the joint that is being replaced - first need to widen the joint
                const replaceJointId = activeJointsQueueRef.current[0];
                console.log("replaceJointId", replaceJointId, i);

                const [jointRef, body1Id, body2Id] = directGetJoint(replaceJointId);
                const joint = jointRef.current;
                const scaleAnchor = (anchor) => ({
                    x: anchor.x * 2,
                    y: anchor.y * 2,
                    z: anchor.z * 2,
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
                // Need to wait for the joints to update first so the midpoint is up to date.
                const node1 = directGetNode(body1Id);
                const node2 = directGetNode(body2Id);
                const body1Ref = node1.ref.current;
                const body2Ref = node2.ref.current;
                // Create the particle in the middle and let the joints "pull" it into place.
                const midpoint = utils.calculateMidpoint(body1Ref, body2Ref);
                nodeRef.current.worldToLocal(midpoint);
                newPosition[0] = midpoint.x;
                newPosition[1] = midpoint.y;
                newPosition[2] = midpoint.z;
                break;
            }
        }
        entityPositionsRef.current.push(newPosition);
        console.log("Instantiating entityNodeId", id, i, entitiesToInstantiate, entityNodeId, newPosition);
    }

    // This will cause a render on each change of entitiesToInstantiate, adding one entity at a time
    useEffect(() => {
        if (busyInstantiatingRef.current) return;
        //if (props.entitiesReady === false && entitiesToInstantiate.length > 0) return;
        for (let i = 0; i < entityNodes.length; i++) {
            const entityNodeId = entityNodes[i].id;
            if (entitiesToInstantiate.includes(entityNodeId)) continue;
            busyInstantiatingRef.current = true;
            instantiatingIdRef.current = entityNodeId;
            // Use a timer for a delay so we can see the sequence for debug etc 
            setTimeout(() => {
                instantiateEntity(entityNodeId, i);
            }, 1000);
            // This is a hack for now as we should check that deeper levels are ready first
            // Probably just check if all children are ready (rather than all particles)
            if (physicsState !== "ready") {
                setPhysicsState("ready");
            }
            // Add one entity at a time
            break;
        }
    }, [entityInstantiated, entityNodes, props.entitiesReady]);

    useFrame(() => {

        if (instantiateJoints.length || replaceJointWith.length) {
            calculateCenter({
                getNode: directGetNode,
                items: entitiesToInstantiate,
                centerRef: worldCenterRef,
                useWorld: true,
            });
            const instantiatedJointsIndices = instatiateJoints();
            // Filter out indices that have already been processed
            setInstantiateJoints(p => p.filter((value, i) => !instantiatedJointsIndices.includes(i)));
            const replacedJointIndices = replaceJoint();
            // Filter out indices that have already been processed
            setReplaceJointWith(p => p.filter((value, i) => !replacedJointIndices.includes(i)));

            // If we have a shape then update the joints with new angles to allow for change in the number of entities
            if (entitiesToInstantiate.length > 3) {

                // Calculate newJointAngle based on the sum of internal angles of a polygon, dividing it equally among vertices
                alignJointsToPolygon();

                if (false && !coreActive) {
                    createCore();
                }

                // From here on we can increase the size of core radius and extend a jint which is then replaced
            }
        }

        if (busyInstantiatingRef.current) {
            const lastEntity = directGetNode(instantiatingIdRef.current);
            // Is the rigid body reference available
            if (lastEntity?.ref?.current?.current) {
                setEntityInstantiated(lastEntity.id);
                busyInstantiatingRef.current = false;
                //if (entitiesToInstantiate.length == 1) {
                //    lastEntity.ref.current.current.lockRotations(true, true);
                //}
                if (entitiesToInstantiate.length == entityCount && !entitiesReady) {
                    // This could be a property of the node
                    setEntitiesReady(true);
                }
                node.particlesRef.current.push(lastEntity.ref);
            }
        }

        function createCore() {
            calculateCenter({
                getNode: directGetNode,
                items: entitiesToInstantiate,
                centerRef: centerRef,
            });
            coreInitialPositionRef.current = centerRef.current;
            setCoreActive(true);
        }

        function alignJointsToPolygon() {
            const sumInternal = (entitiesToInstantiate.length - 2) * 180;
            const newJointAngle = sumInternal / entitiesToInstantiate.length / 2;

            const quaternion1 = new THREE.Quaternion();
            const quaternion2 = new THREE.Quaternion();
            // Because we use a clockwise direction for joints angle1 is positive, angle2 is negative
            const angle1 = THREE.MathUtils.degToRad(newJointAngle);
            const angle2 = THREE.MathUtils.degToRad(-newJointAngle);

            // For each end of each joint rotate it to match with  newJointAngle
            activeJointsQueueRef.current.forEach((jointId, i) => {
                const [jointRef, body1Id, body2Id] = directGetJoint(jointId);
                const joint = jointRef.current;

                quaternion1.setFromAxisAngle(axis, angle1);
                quaternion2.setFromAxisAngle(axis, angle2);

                const anchor1 = joint.anchor1();
                const anchor2 = joint.anchor2();
                const radius1 = vec3(anchor1).length();
                const radius2 = vec3(anchor2).length();

                const newX1 = radius1 * Math.cos(angle1);
                const newY1 = radius1 * Math.sin(angle1);
                const newX2 = radius2 * Math.cos(angle2);
                const newY2 = radius2 * Math.sin(angle2);

                joint.setAnchor1(new THREE.Vector3(newX1, newY1, 0));
                joint.setAnchor2(new THREE.Vector3(newX2, newY2, 0));
            });
        }

        // Replace a joint with a new entity and two joints
        function replaceJoint() {
            const replacedJointIndices = [];
            // Replace a joint with a new entity and connect that entity
            replaceJointWith.forEach(([nextId, newPosition], i) => {
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

                //applyNewJointPositions(newPosition, body1Ref, nextBodyRef, anchor1, anchor2, entityRadius);
                anchor1.multiplyScalar(0.5);
                anchor2.multiplyScalar(0.5);
                createJoint(body1Ref, anchor1, nextBodyRef, anchor2);
                activeJointsQueueRef.current.push(utils.jointId(node1.id, nextEntity.id));

                //applyNewJointPositions(newPosition, nextBodyRef, body2Ref, anchor1, anchor2, entityRadius);
                createJoint(nextBodyRef, anchor1, body2Ref, anchor2);
                activeJointsQueueRef.current.push(utils.jointId(node2.id, nextEntity.id));

                deleteJoint(replaceJointId);
                activeJointsQueueRef.current.shift();

                replacedJointIndices.push(i);
            });

            return replacedJointIndices;
        }

        // Create a new joint connecting entities that are already connected
        function instatiateJoints() {
            const instantiatedJointsIndices = [];
            instantiateJoints.forEach(([id1, id2], i) => {
                if (id1 === null && id2 === null) {
                    instantiatedJointsIndices.push(i);
                    return; // special case for first entity (no join to create for now
                }
                const node1 = directGetNode(id1);
                const node2 = directGetNode(id2);
                const body1Ref = node1.ref.current;
                const body2Ref = node2.ref.current;
                if (!body1Ref?.current || !body2Ref?.current) return;
                // Should deal with different radius
                const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref, body2Ref, entityRadius);
                createJoint(body1Ref, offset1, body2Ref, offset2);
                activeJointsQueueRef.current.push(utils.jointId(node1.id, node2.id));
                instantiatedJointsIndices.push(i);
            });
            return instantiatedJointsIndices;
        }
    });

    useFrame(() => {
        return
        if (entityCount == 0) return;
        // State machine can distribute computation across frames, reducing load on the physics engine
        switch (frameStateRef.current) {
            case "init":
                // useEffect to call initializeJoints because it may take longer than a frame
                if (physicsState === "waiting") {
                    const allParticleRefs = directGetAllParticleRefs(id);
                    if (allParticleRefs.length) {
                        //console.log("allParticleRefs.length", id, allParticleRefs.length)
                        let particlesExist = true;
                        allParticleRefs.forEach((particleRef) => {
                            if (!particleRef.current) {
                                particlesExist = false;
                            }
                        });
                        if (particlesExist) setPhysicsState("initialize");
                    }
                }
                if (isPhysicsReady()) {
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

    return (
        <group>
            <CompoundEntityGroup ref={nodeRef} position={initialPosition} >
                {entitiesToInstantiate.map((_, i) => {
                    let entity = entityNodes[i];
                    let EntityType = (entity.childrenIds.length === 0) ? Particle : CompoundEntity;
                    // If the entity changes from a Particle to a CompoundEntity then the ref needs to be cleared ?
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
                            entitiesReady={entitiesReady}
                        />
                    )
                })}

                {coreActive && (
                    <RigidBody
                        ref={coreRef}
                        position={coreInitialPositionRef.current}
                        type={"dynamic"}
                        colliders={false}
                        enabledTranslations={[true, true, false]}
                        enabledRotations={[false, false, true]}
                    >
                        <BallCollider ref={coreColliderRef} args={[entityRadius * 0.1]} />
                    </RigidBody>
                )}

                {physicsState === "ready" && (
                    <group>
                        {entitiesReady && (
                            <Blob
                                color={localColor}
                                node={node}
                                centerRef={centerRef}
                                entityNodes={entityNodes}
                            />
                        )}
                        {node.depth === 0 && (
                            <group>
                                <ParticlesInstance
                                    id={`${id}`}
                                    node={node}
                                />
                                {config.showRelations && (
                                    <Relations
                                        id={`${id}`}
                                        node={node}
                                    />
                                )}
                            </group>
                        )}
                    </group>
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

function applyNewJointPositions(newPosition, bodyRef1, bodyRef2, anchor1, anchor2, radius) {
    if (newPosition) {
        const { offset1, offset2 } = utils.calculateJointOffsets(bodyRef1, bodyRef2, radius);
        Object.assign(anchor1, offset1);
        Object.assign(anchor2, offset2);

        const rotation1 = quat(bodyRef1.current.rotation());
        anchor1.applyQuaternion(rotation1);
        const rotation2 = quat(bodyRef2.current.rotation());
        anchor2.applyQuaternion(rotation2);
    } else {
        anchor1.multiplyScalar(0.5);
        anchor2.multiplyScalar(0.5);
    }
}
