import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
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
import useWhyDidYouUpdate from './useWhyDidYouUpdate';
import { vec3, quat } from '@react-three/rapier';
import useStore from '../../useStore'

/*

  Even when instantiating a compoundEntitywe need to create physical space so we first instantiate particles.

  The config.animDelayMs is needed to give the Particles time to move and create space before inserting a new particle.

  CompoundEntityGroup introduces a 90 degree clockwise rotation. 
    The orientation vector is toward the center and we want the shape to be orthogonal to this
        for example, a set of compoundEntity, each with two particles, should form a circular shape

  The behavior of the compoundEntity is centralized in a state machine that runs on each frame

*/

// Right click on particle could show top blob in the same color
// Test useAnimateImpulses, useAnimateJoints, useAnimateRelations

const CompoundEntity = React.memo(React.forwardRef(({ id, initialPosition = [0, 0, 0], radius, debug, config, outer = {}, ...props }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const nodeRef = useRef();
    useImperativeHandle(ref, () => nodeRef.current);

    // Direct access to the state outside of React's render flow
    const {
        getNode: directGetNode,
        updateNode: directUpdateNode,
        getJoint: directGetJoint,
        resetParticlesHash: directResetParticlesHash,
        getParticlesHash: directGetParticlesHash,
    } = useStoreEntity.getState();

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
    const color = useMemo(() => utils.getColor(configColor, props.color), [configColor, props.color]);
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    const entityRadius = useMemo(() => Math.min(radius * Math.PI / (entityCount + Math.PI), radius / 2) * 0.97, [radius, entityCount]);
    //const entityRadius = radius / entityCount;
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    const worldCenterRef = useRef(new THREE.Vector3());
    // State machine that can distribute computation across frames
    const frameStateRef = useRef("init");
    const prevFrameStateRef = useRef();
    const [entitiesToInstantiate, setEntitiesToInstantiate] = useState([]);
    // Block the instantiating of next entity (unless null)
    const [nextEntity, setNextEntity] = useState();
    const activeJointsQueueRef = useRef([]);
    const [jointsMapped, setJointsMapped] = useState(false);
    const jointsFromRef = useRef({});
    const jointsToRef = useRef({});
    const parentJointsFromRef = useRef(props.jointsFrom || []);
    const parentJointsToRef = useRef(props.jointsTo || []);
    // Create once instead of inside function
    const entityInitialQuaternion = new THREE.Quaternion();
    const quaternion = props.initialQuaternion || new THREE.Quaternion();
    const particlesInstanceRef = useRef();
    const initialShowParticlesRef = useRef();
    const prevParticlesHash = useRef();
    const frameStateDurationRef = useRef(0);

    const setOption = useStore((state) => state.setOption);
    const showParticles = useStore((state) => state.getOption("showParticles"));
    const pausePhysics = useStore((state) => state.pausePhysics);

    const JOINT_EXPANSION = 1.1; // Slightly bigger to avoid "hitting" the surrounding particles
    const IN_INDEX = 0;
    const OUT_INDEX = (entityCount == 1) ? 0 : 1;
    const FORWARD = new THREE.Vector3(1, 0, 0); 

    // This repeats the id 
    const entityPoseRef = useRef({
        positions: {},
        orientations: {},
        outer: {},
    });

    const { deleteJoint, createJoint, updateJoint } = useJoints();

    useAnimateImpulses(jointsMapped, node, entityNodes, initialPosition, radius, config);
    useAnimateRelations(jointsMapped, node, entityNodes, config);
    useAnimateJoints(jointsMapped, node, entityNodes, deleteJoint, createJoint, config);

    // Mounting
    useEffect(() => {
        directUpdateNode(id, { initialPosition });
        console.log(`Mounting CompoundEntity ${id} at depth ${node.depth}`);
        node.ref.current.setVisualConfig({ color: props.color, uniqueId: id, radius: radius });
        if (node.childrenIds.length > 0 && node.isParticle) {
            // This is because we may be swaping the node from a Particle to a CompoundEntity
            // Need to correct this so the storeEntity maintains a valid list of Particles
            directUpdateNode(id, {isParticle: false});
        }
        // Get parents To/From joints so they can be mapped to particles in lower level entities
        const inNode = entityNodes[IN_INDEX];
        const outNode = entityNodes[OUT_INDEX];
        jointsFromRef.current[outNode.id] = props.jointsFrom;
        jointsToRef.current[inNode.id] = props.jointsTo;
    }, []);

    // Switch the origin/destination of a joint. Used to map parent joints to children.
    function swapJoints(jointsRef, newNodeId, isTo) {
        const jointsUpdated = [];
        jointsRef.current.forEach(jointId => {
            const {body1Id, body2Id} = directGetJoint(jointId);
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

    // Position, orientation, and whether the entity is on the perimeter (outer) of the parent blob
    function entityPose(instantiateEntityId) {
        //console.log("poseEntity", jointExpanded, triggerNoJoint);
        const toInstantiateCount = entitiesToInstantiate.length;
        // If we have a shape then update the joints with new angles to allow for change in the number of entities
        let newPosition = [0, 0, 0];
        switch (toInstantiateCount) {
            case 0:
                if (entityCount > 1) {
                    newPosition[0] -= entityRadius;
                }
                break;
            case 1: {
                newPosition[0] += entityRadius;
                break;
            }
            case 2: {
                newPosition[1] -= entityRadius * Math.sqrt(3);
                break;
            }
            case 3: {
                newPosition[1] += entityRadius * Math.sqrt(3);
                break;
            }
            default: {
                const replaceJointId = activeJointsQueueRef.current[0];
                const {jointRef, body1Id} = directGetJoint(replaceJointId);
                // Find the endpoint of one joint anchor
                const joint = jointRef.current;
                const anchor1 = vec3(joint.anchor1());
                const node1 = directGetNode(body1Id);
                const body1 = node1.ref.current;
                const body1position = vec3(body1.translation());
                // apply the body rotation to the anchor
                const quaternion1 = quat(body1.rotation());
                anchor1.applyQuaternion(quaternion1);
                const endpoint = anchor1.add(body1position);
                nodeRef.current.worldToLocal(endpoint);
                newPosition = [endpoint.x, endpoint.y, endpoint.z];
                break;
            }
        }
        const entityOrientation = centerRef.current.clone()
        entityOrientation.sub(new THREE.Vector3(...newPosition));
        // If zero vector, set to default direction
        if (entityOrientation.lengthSq() === 0) {
            entityOrientation.set(1, 0, 0);
        } else {
            entityOrientation.normalize();
        }
        // If vectors are directly opposite, the resulting quaternion can cause a flip that affects other axes than intended.
        const EPSILON = 0.01;  // You can adjust this value as needed
        if (Math.abs(FORWARD.dot(entityOrientation) + 1) < EPSILON) {
            // Vectors are opposite, manually create quaternion for 180-degree rotation around the Z-axis
            entityInitialQuaternion.set(0, 0, 1, 0);
        } else {
            entityInitialQuaternion.setFromUnitVectors(FORWARD, entityOrientation);
        }
        entityPoseRef.current.orientations[instantiateEntityId] = entityInitialQuaternion;
        entityPoseRef.current.positions[instantiateEntityId] = newPosition;
        entityPoseRef.current.outer[instantiateEntityId] = {...outer, [node.depth]: true};
        // Strip out any id from entitiesToInstantiate that is not in entityNodes and add next entity
        setEntitiesToInstantiate(p => [...p.filter(id => node.childrenIds.includes(id)), instantiateEntityId]);
    }

    function addActiveJoint(id1, id2) {
        const jointId = utils.jointId(id1, id2);
        jointsFromRef.current[id1] = jointsFromRef.current[id1] ?? [];
        jointsFromRef.current[id1].push(jointId);
        jointsToRef.current[id2] = jointsToRef.current[id2] ?? [];
        jointsToRef.current[id2].push(jointId);
        activeJointsQueueRef.current.push(jointId);
    }

    function createNodeJoint(id1, id2) {
        const node1 = directGetNode(id1);
        const node2 = directGetNode(id2);
        const body1Ref = node1.ref.current;
        const body2Ref = node2.ref.current;
        const visualConfig1 = node1.ref.current.getVisualConfig();
        const body1radius = visualConfig1.radius;
        const visualConfig2 = node2.ref.current.getVisualConfig();
        const body2radius = visualConfig2.radius;
        const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref, body2Ref, body1radius, body2radius);
        createJoint(node.chainRef, body1Ref, offset1, body2Ref, offset2);
        addActiveJoint(id1, id2);
    }

    // Replace a joint with a new entity and two joints
    function replaceJoint(nextId) {
        const nextEntity = directGetNode(nextId);
        const nextBodyRef = nextEntity.ref.current;

        const replaceJointId = activeJointsQueueRef.current[0];

        const {jointRef, body1Id, body2Id} = directGetJoint(replaceJointId);
        const anchor1 = vec3(jointRef.current.anchor1());
        const anchor2 = vec3(jointRef.current.anchor2());

        const node1 = directGetNode(body1Id);
        const node2 = directGetNode(body2Id);
        const body1Ref = node1.ref.current;
        const body2Ref = node2.ref.current;

        // Assumes that we previously expanded the joint
        const unExpandAnchor = (anchor) => {
            // Normalize the anchor vector
            const normalizedAnchor = anchor.clone().normalize();
            // Scale the normalized vector by the entityRadius
            const expansion = normalizedAnchor.multiplyScalar(entityRadius * JOINT_EXPANSION);
            // Add the scaled vector to the original anchor
            anchor.sub(expansion);
        };

        unExpandAnchor(anchor1);
        unExpandAnchor(anchor2);

        createJoint(node.chainRef, body1Ref, anchor1, nextBodyRef, anchor2);
        addActiveJoint(body1Id, nextEntity.id) 

        createJoint(node.chainRef, nextBodyRef, anchor1, body2Ref, anchor2);
        addActiveJoint(nextEntity.id, body2Id) 

        deleteJoint(node.chainRef, replaceJointId);
        if (jointsFromRef.current[body1Id]) {
            jointsFromRef.current[body1Id] = jointsFromRef.current[body1Id].filter((jointId) => jointId !== replaceJointId);
        }
        if (jointsToRef.current[body2Id]) {
            jointsToRef.current[body2Id] = jointsToRef.current[body2Id].filter((jointId) => jointId !== replaceJointId);
        }
        parentJointsFromRef.current = parentJointsFromRef.current.filter((jointId) => jointId !== replaceJointId);
        parentJointsToRef.current= parentJointsToRef.current.filter((jointId) => jointId !== replaceJointId);
        activeJointsQueueRef.current.shift();
    }

    const calculateCenter = (entityIds) => {
        worldCenterRef.current.set(0, 0, 0); // Reset the center vector
        let activeEntities = 0;
        entityIds.forEach((item) => {
            const entityNode = directGetNode(item);
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

    function alignJointsToPolygon(verticesCount) {
        const sumInternal = (verticesCount - 2) * 180;
        const newJointAngle = sumInternal / verticesCount / 2;

        // Because we use a clockwise direction for joints angle1 is negative, angle2 is positive
        const angle1 = THREE.MathUtils.degToRad(-newJointAngle);
        const angle2 = THREE.MathUtils.degToRad(newJointAngle);

        // For each end of each joint rotate it to match with newJointAngle
        activeJointsQueueRef.current.forEach((jointId, i) => {
            const {jointRef} = directGetJoint(jointId);
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

            joint.setAnchor1(newAnchor1);
            joint.setAnchor2(newAnchor2);
        });
    }

    // deltaTime is in seconds
    useFrame((_, deltaTime) => {

        if (prevFrameStateRef.current !== frameStateRef.current) {
            frameStateDurationRef.current = 0;
        } else {
            if (!pausePhysics) frameStateDurationRef.current += deltaTime;
        }

        calculateCenter(entitiesToInstantiate);

        prevFrameStateRef.current = frameStateRef.current
        const animDelay = config.animDelayMs / 1000;
        
        // State machine can distribute computation across frames, reducing load on the physics engine
        // Also provides the "growth" algorithm for the compoundEntity
        // Could be expanded to allow for adding/removing nodes
        switch (frameStateRef.current) {
            case "init": {
                if (id == "root" && !showParticles) {
                    // So we can see something while things are "growing"
                    setOption("showParticles", true);
                    // Will be used to restore the original setting after "grown"
                    initialShowParticlesRef.current = false;
                }
                frameStateRef.current = "selectNextEntity";
                break;
            }
            case "selectNextEntity": {
                // Add entities one by one
                const toInstantiateCount = entitiesToInstantiate.length;
                // Don't pause for the first entity
                if (toInstantiateCount > 0 && frameStateDurationRef.current < animDelay) break;
                for (let i = 0; i < entityNodes.length; i++) {
                    const entityNodeId = entityNodes[i].id;
                    if (entitiesToInstantiate.includes(entityNodeId)) continue;
                    setNextEntity(entityNodeId);
                    if (toInstantiateCount >= 2) {
                        // Add one because we have not yet set the new entity in entitiesToInstantiate
                        alignJointsToPolygon(toInstantiateCount + 1);
                    }
                    if (toInstantiateCount < 2) {
                        frameStateRef.current = "poseEntity";
                    } else {
                        frameStateRef.current = "expandJoint";
                    }
                    break;
                }
                break;
            }
            case "expandJoint": {
                /*
                    To dynamically increase the entity count we need a symmetrical entity
                    With 1,2,3 we have a special case, with 4 entities we have a symmetrical shape
                    From there we can add entities by taking the oldest joint, expanding it, inserting an entity in the middle
                */
                const replaceJointId = activeJointsQueueRef.current[0];
                // Scale up the joint to create space for a new entity
                const {jointRef} = directGetJoint(replaceJointId);
                const joint = jointRef.current;
                const expandAnchor = (anchor) => {
                    const normalizedAnchor = anchor.clone().normalize();
                    const expansion = normalizedAnchor.multiplyScalar(entityRadius * JOINT_EXPANSION);
                    return anchor.add(expansion);
                };
                joint.setAnchor1(expandAnchor(vec3(joint.anchor1())));
                joint.setAnchor2(expandAnchor(vec3(joint.anchor2())));
                frameStateRef.current = "waitForExpansion";
                break;
            }
            case "waitForExpansion": {
                // Check if the joint has expanded
                const replaceJointId = activeJointsQueueRef.current[0];
                const {body1Id, body2Id} = directGetJoint(replaceJointId);
                // get the radius of the bodies
                const node1 = directGetNode(body1Id);
                const node2 = directGetNode(body2Id);
                // distance between the bodies
                const body1 = node1.ref.current;
                const body2 = node2.ref.current;
                const body1position = vec3(body1.translation());
                const body2position = vec3(body2.translation());
                const difference = body1position.sub(body2position);
                // Calculate the Euclidean distance using the length of the difference vector
                const distance = difference.length();
                if (distance > entityRadius * 2) {
                    frameStateRef.current = "poseEntity";
                }
                break;
            }
            case "poseEntity": {
                // After entityPose entitiesToInstantiate will have nextEntity appended
                entityPose(nextEntity);
                frameStateRef.current = "waitForParticle";
                break;
            }
            case "waitForParticle": {
                const lastEntity = directGetNode(nextEntity);
                // Is the rigid body reference available
                const particleRef = lastEntity.ref;
                if (particleRef?.current?.current) {
                    frameStateRef.current = "replaceJoint";
                    node.particlesRef.current.push(particleRef);
                }
                break;
            }
            case "replaceJoint": {
                const toInstantiateCount = entitiesToInstantiate.length;
                switch (toInstantiateCount) {
                    case 1:
                        break; // single entity so no joints
                    case 2: {
                        // No joints to replace so we create joints
                        createNodeJoint(entityNodes[0].id, entityNodes[1].id);
                        createNodeJoint(entityNodes[1].id, entityNodes[0].id);
                        break;
                    }
                    default: {
                        replaceJoint(nextEntity);
                        break;
                    }
                } 
                if (toInstantiateCount == entityCount) {
                    frameStateRef.current = "initialParticlesInstantiated";
                } else {
                    if (toInstantiateCount > 2) {
                        // If we have a shape then update the joints with new angles to allow for change in the number of entities
                        // Do we need to d othis a second time here ?
                        frameStateRef.current = "alignJointsToPolygon";
                    } else {
                        frameStateRef.current = "selectNextEntity";
                    }
                }
                break;
            }
            case "alignJointsToPolygon": {
                const toInstantiateCount = entitiesToInstantiate.length;
                alignJointsToPolygon(toInstantiateCount);
                frameStateRef.current = "selectNextEntity";
                break;
            }
            case "initialParticlesInstantiated": {
                if (frameStateDurationRef.current < animDelay) break;
                // Update the initialPositions based on current positions
                entitiesToInstantiate.forEach((entityId, i) => {
                    const entityNode = directGetNode(entityId);
                    const position = vec3(entityNode.ref.current.translation());
                    nodeRef.current.worldToLocal(position);
                    entityPoseRef.current.positions[entityId] = position;
                })
                swapJoints(parentJointsToRef, entitiesToInstantiate[IN_INDEX], true);
                swapJoints(parentJointsFromRef, entitiesToInstantiate[OUT_INDEX], false);
                directResetParticlesHash();
                setJointsMapped(true);
                if (id == "root") {
                    console.log("useStoreEntity", useStoreEntity.getState());
                    nodeRef.current.setVisualConfig(p => ({ ...p, visible: true }));
                    directUpdateNode(id, {visible: true});
                    frameStateRef.current = "stableRoot";
                } else {
                    frameStateRef.current = "done";
                }
                break;
            }
            case "stableRoot": {
                if (frameStateDurationRef.current < animDelay) break;
                const hash = directGetParticlesHash(id);
                if (prevParticlesHash.current !== hash) {
                    prevParticlesHash.current = hash;
                    frameStateDurationRef.current = 0;
                } else {
                    setOption("showParticles", initialShowParticlesRef.current);
                    console.log("showParticles", id, initialShowParticlesRef.current)
                    frameStateRef.current = "done";
                }
                break;
            }
            case "done":
                break;
            default:
                console.error("Unexpected state", id, frameStateRef.current)
                break;
        }

    });

    //console.log("CompoundEntity rendering", id, "node", node, "entityCount", entityCount)
    //useWhyDidYouUpdate(`CompoundEntity ${id}`, {id, initialPosition, radius, debug, config, node, entityNodes, entitiesToInstantiate, instantiateJoints, replaceJointWith, initParticles, jointsMapped} );

    return (
        <group>
             <CompoundEntityGroup ref={nodeRef} position={initialPosition} initialQuaternion={quaternion} id={id}>
                {entitiesToInstantiate.map((entityId, i) => {
                    let entity = directGetNode(entityId);
                    let EntityType = CompoundEntity;
                    if (entity.childrenIds.length === 0) {
                        EntityType = Particle;
                    } else if (!jointsMapped) {
                        EntityType = Particle;
                    }
                    return (
                        <EntityType
                            key={`${id}-${i}`}
                            id={`${entityId}`}
                            initialPosition={entityPoseRef.current.positions[entityId]}
                            radius={entityRadius}
                            color={color}
                            ref={entity.ref}
                            debug={isDebug}
                            config={config}
                            jointsTo={jointsToRef.current[entity.id] || []}
                            jointsFrom={jointsFromRef.current[entity.id] || []}
                            initialQuaternion={entityPoseRef.current.orientations[entityId]}
                            outer={entityPoseRef.current.outer[entityId]}
                        />
                    )
                })}

                {jointsMapped && (
                    <Blob
                        color={color}
                        node={node}
                        entityNodes={entityNodes}
                    />
                )}
                {id === "root" && config.showRelations && (
                    <Relations
                        node={node}
                    />
                )}
                {isDebug && (
                    <DebugRender
                        id={id}
                        radius={radius}
                        color={color}
                        initialPosition={initialPosition}
                        newJointsRef={node.jointsRef}
                        nodeRef={nodeRef}
                        isDebug={isDebug}
                        centerRef={centerRef}
                    />
                )}
            </CompoundEntityGroup>
            {id === "root" && (
                <ParticlesInstance
                    id={`${id}`}
                    ref={particlesInstanceRef}
                    config={config}
                />
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