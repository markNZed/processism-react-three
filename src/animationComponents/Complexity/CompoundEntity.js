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
import useWhyDidYouUpdate from './useWhyDidYouUpdate';
import { vec3, quat } from '@react-three/rapier';
import useAppStore from '../../useAppStore'
import { useStore } from 'zustand';
import { diff} from 'deep-object-diff';

/*

  Even when instantiating a compoundEntitywe need to create physical space so we first instantiate particles.

  The config.animDelayMs is needed to give the Particles time to move and create space before inserting a new particle.

  CompoundEntityGroup introduces a 90 degree clockwise rotation. 
    The orientation vector is toward the center and we want the shape to be orthogonal to this
        for example, a set of compoundEntity, each with two particles, should form a circular shape

  The behavior of the compoundEntity is centralized in a state machine that runs on each frame

  https://rapier.rs/javascript3d/index.html for details on Rapier API
  RigidBodySet might be a way of managing particles

*/

// Right click on particle could show top blob in the same color
// Test useAnimateImpulses
// The lower blob joints should be put in place before the higher
// We are rotating the compoundEntity using the compoundEntityGroup is this to avoid applying this rotation to particles ?
// Slow to build with more particles

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
    } = config.entityStore.getState();

    const selectNode = useCallback((state, id) => {
        return state.nodes[id];
    }, [id]);
    
    const node = useStore(config.entityStore, state => selectNode(state, id)); 

    const selectEntityNodes = useCallback((state, id) => {
        const node = state.nodes[id];
        if (!node) return [];
        // Retrieve the current child nodes based on the childrenIds
        const currentChildNodes = (node.childrenIds || []).map(childId => state.nodes[childId]);
        const diffResult = diff({...currentChildNodes}, {...prevEntityNodes.current});
        // If shallow equal to the previous child nodes, return the same array reference
        if (Object.keys(diffResult).length === 0) {
            return prevEntityNodes.current; // Return the old reference to avoid unnecessary re-render
        }
        // Store the new array in the node for future comparisons
        prevEntityNodes.current = currentChildNodes;
        return currentChildNodes;
    }, []);

    const prevEntityNodes = useRef();
    const entityNodes = useStore(config.entityStore, state => selectEntityNodes(state, id));

    const isDebug = node.debug || debug || config.debug;
    const entityCount = node.childrenIds.length;
    // Store the color in a a state so it is consistent across renders (when defined by a function)
    const configColor = config.colors[node.depth];
    const color = useMemo(() => utils.getColor(configColor, props.color), [configColor, props.color]);
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    const entityRadius = useMemo(() => Math.min(radius * Math.PI / (entityCount + Math.PI), radius / 2) * 0.97, [radius, entityCount]);
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3(0, 0, 0));
    const worldCenterRef = useRef(new THREE.Vector3());
    // State machine that can distribute computation across frames
    const frameStateRef = useRef("init");
    const prevFrameStateRef = useRef();
    const [entitiesToInstantiate, setEntitiesToInstantiate] = useState([]);
    // Block the instantiating of next entity (unless null)
    const nextEntityIdRef = useRef();
    const nextEntityRef = useRef();
    const nextEntityRadiusRef = useRef();
    const activeJointsQueueRef = useRef([]);
    const [jointsMapped, setJointsMapped] = useState(false);
    const jointsFromRef = useRef({});
    const jointsToRef = useRef({});
    const parentJointsFromRef = useRef(props.jointsFrom || []);
    const parentJointsToRef = useRef(props.jointsTo || []);
    // Create once instead of inside function
    const entityInitialQuaternion = new THREE.Quaternion();
    const quaternion = props.quaternion || new THREE.Quaternion();
    const particlesInstanceRef = useRef();
    const initialShowParticlesRef = useRef();
    const prevParticlesHash = useRef();
    const frameStateDurationRef = useRef(0);
    const frameCountRef = useRef(0);
    const creationSource = new THREE.Vector3();
    const entityIdsCreatedRef = useRef([]);
    const lastPositionAndOuterRef = useRef();
    const structureChanging = useRef(true);

    const setAppOption = useAppStore((state) => state.setOption);
    const showParticles = useAppStore((state) => state.getOption("showParticles"));
    const hideBlobs = useAppStore((state) => state.getOption("hideBlobs"));
    const pausePhysics = useAppStore((state) => state.pausePhysics);

    const JOINT_EXPANSION = 1.1; // Slightly bigger to avoid "hitting" the surrounding particles
    const IN_INDEX = 0;
    const OUT_INDEX = (entityCount == 1) ? 0 : 1;
    const FORWARD = new THREE.Vector3(1, 0, 0); 

    // This repeats the id 
    const entityPoseRef = useRef({
        position: {},
        orientation: {},
        outer: {},
        creationPathRefs: {},
        radius: {},
    });

    const { deleteJoint, createJoint, updateJoint } = useJoints(config);

    useAnimateImpulses(jointsMapped, node, entityNodes, initialPosition, radius, config);
    useAnimateRelations(jointsMapped, node, entityNodes, config);
    useAnimateJoints(jointsMapped, node, entityNodes, deleteJoint, createJoint, worldCenterRef, config);

    // Mounting
    useEffect(() => {
        directUpdateNode(id, { initialPosition });
        console.log(`Mounting CompoundEntity ${id} at depth ${node.depth} with radius ${radius} and entityRadius ${entityRadius}`);
        node.ref.current.setPhysicsConfig({ color: color, uniqueId: id, radius: radius });
        if (node.childrenIds.length > 0 && node.isParticle) {
            // This is because we may be swaping the node from a Particle to a CompoundEntity
            // Need to correct this so the storeEntity maintains a valid list of Particles
            directUpdateNode(id, {isParticle: false});
        }
        // Get parents To/From joints so they can be mapped to particles in lower level entities
        const inNode = entityNodes[IN_INDEX];
        const outNode = entityNodes[OUT_INDEX];
        if (outNode?.id) {
            jointsFromRef.current[outNode.id] = props.jointsFrom;
        }
        if (inNode?.id) {
            jointsToRef.current[inNode.id] = props.jointsTo;
        }
    }, []);

    function getClosestNodeId(worldpos, index) {
        //return entitiesToInstantiate[2]; // Does not work with lowest compoundEntity
        //return entitiesToInstantiate[index];
        let distance = Infinity;
        let closestNodeId = null;
        entitiesToInstantiate.forEach((entityId) => {
            const outerNode = entityPoseRef.current.outer[entityId][node.depth];
            if (!outerNode) return;
            const entityRef = directGetNode(entityId).ref;
            const entityPosition = vec3(entityRef.current.translation());
            const distanceToEntity = entityPosition.sub(worldpos);
            const distanceToEntityLength = distanceToEntity.length();
            if (distanceToEntityLength < distance) {
                distance = distanceToEntityLength;
                closestNodeId = entityId;
            }
        })
        if (closestNodeId === null) {
            throw new Error("No closest node found");
        }
        return closestNodeId;
    }

    // Switch the origin/destination of a joint. Used to map parent joints to children.
    // Need to update node.jointsRef
    function swapJoints(jointsRef, isTo) {
        jointsRef.current.forEach(jointId => {
            const {body1Id, body2Id} = directGetJoint(jointId);
            let node1Ref;
            let node2Ref;
            if (isTo) {
                node1Ref = directGetNode(body1Id).ref;
                const node1Center = node1Ref.current.getCenterWorld();
                let closestNodeId;
                if (entitiesToInstantiate.length > 4) {
                    closestNodeId = getClosestNodeId(node1Center, IN_INDEX);
                } else {
                    closestNodeId = entitiesToInstantiate[IN_INDEX];
                }
                const node2 = directGetNode(closestNodeId);
                node2.jointsRef.current.push(jointId);
                node2Ref = node2.ref;
            } else {
                // Find the closest node to body2Id
                node2Ref = directGetNode(body2Id).ref;
                const node2Center = node2Ref.current.getCenterWorld();
                let closestNodeId;
                if (entitiesToInstantiate.length > 4) {
                    closestNodeId = getClosestNodeId(node2Center, OUT_INDEX);
                } else {
                    closestNodeId = entitiesToInstantiate[OUT_INDEX];
                }
                const node1 = directGetNode(closestNodeId);
                node1.jointsRef.current.push(jointId);
                node1Ref = node1.ref;
                
            }
            // Find the distance between the nodes
            const distance = node1Ref.current.getCenterWorld().distanceTo(node2Ref.current.getCenterWorld());
            const radius1 = distance / 2;
            const radius2 = distance / 2;
            const { offset1, offset2 } = utils.calculateJointOffsets(node1Ref.current, node2Ref.current, radius1, radius2);
            updateJoint(node.chainRef, jointId, node1Ref.current, offset1, node2Ref.current, offset2);
        });
    }

    function contractJoints(jointIds) {
        let fitted = true;
        jointIds.forEach(jointId => {
            const {jointRef, body1Id, body2Id} = directGetJoint(jointId);

            if (!jointRef.current || !jointRef.current.isValid()) return;

            const node1Ref = directGetNode(body1Id).ref;
            const node2Ref = directGetNode(body2Id).ref;

            const physicsConfig1 = node1Ref.current.getPhysicsConfig();
            const physicsConfig2 = node2Ref.current.getPhysicsConfig();
            const radius1 = physicsConfig1.colliderRadius;
            const radius2 = physicsConfig2.colliderRadius;

            const anchor1 = jointRef.current.anchor1();
            const anchor2 = jointRef.current.anchor2();

            const distance1 = vec3(anchor1).length();
            const distance2 = vec3(anchor2).length();

            const SCALE = 0.995;

            const scaleAnchor = (anchor, scale) => ({
                x: anchor.x * scale,
                y: anchor.y * scale,
                z: anchor.z * scale,
            });

            if (distance1 > radius1) {
                const extended = (distance1 - radius1);
                if (extended < 0.1) {
                    const scale = radius1 / distance1;
                    jointRef.current.setAnchor1(scaleAnchor(anchor1, scale));
                } else {
                    jointRef.current.setAnchor1(scaleAnchor(anchor1, SCALE));
                    fitted = false;
                }
            }

            if (distance2 > radius2) {
                const extended = (distance2 - radius2);
                if (extended < 0.1) {
                    const scale = radius2 / distance2;
                    jointRef.current.setAnchor2(scaleAnchor(anchor2, scale));
                } else {
                    jointRef.current.setAnchor2(scaleAnchor(anchor2, SCALE));
                    fitted = false;
                }
            }

        });
        return fitted;
    }

    function positionAndOuter(toInstantiateCount) {
        //let newPosition = [0, 0, 0];
        let newPosition = [centerRef.current.x, centerRef.current.y, centerRef.current.z];
        let thisOuter = true;
        switch (toInstantiateCount) {
            case 0:
                if (entityCount > 1) {
                    //newPosition[0] -= nextEntityRadiusRef.current;
                }
                break;
            case 1: {
                // Get position of first entity
                // This is not accounting for the rotation of the compoundEntity ? 
                newPosition[0] += nextEntityRadiusRef.current;
                break;
            }
            case 2: {
                newPosition[1] -= nextEntityRadiusRef.current * Math.sqrt(3);
                break;
            }
            default: {
                const last = lastPositionAndOuterRef.current;
                const replaceJointId = activeJointsQueueRef.current[0];
                let anchor1;
                let body1;
                if (last && last.replaceJointId === replaceJointId) {
                    const {jointRef, body1Id} = directGetJoint(replaceJointId);
                    thisOuter = entityPoseRef.current.outer[body1Id][node.depth];
                    anchor1 = last.anchor1.clone(); // clone so applyQuaternion does not modify
                    const body1Ref = last.body1Ref;
                    thisOuter = last.thisOuter;
                    body1 = body1Ref.current;
                } else {
                    const {jointRef, body1Id} = directGetJoint(replaceJointId);
                    thisOuter = entityPoseRef.current.outer[body1Id][node.depth];
                    // Find the endpoint of one joint anchor
                    const joint = jointRef.current;
                    anchor1 = vec3(joint.anchor1());
                    const node1 = directGetNode(body1Id);
                    const body1Ref = node1.ref;
                    body1 = body1Ref.current;
                    // Clone anchor1 so we do not store the rotataion applied below
                    lastPositionAndOuterRef.current = {replaceJointId, anchor1: anchor1.clone(), body1Ref, thisOuter};
                }
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
        return {newPosition, thisOuter};
    }

    function getEntityRadius(entity) {
        if (entity.childrenIds.length === 0) {
            return config.particleRadius;
        } else {
            return entityRadius;
        }
    }

    // Position, orientation, and whether the entity is on the perimeter (outer) of the parent blob
    function entityPose(instantiateEntityId) {
        const { newPosition, thisOuter } = positionAndOuter(entitiesToInstantiate.length);
        console.log("poseEntity", instantiateEntityId, newPosition, thisOuter);
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

        entityPoseRef.current.orientation[instantiateEntityId] = entityInitialQuaternion;
        entityPoseRef.current.position[instantiateEntityId] = newPosition;
        entityPoseRef.current.outer[instantiateEntityId] = {...outer, [node.depth]: thisOuter};

        const creationPath = [...config.initialCreationPath]; // Shallow copy
        creationPath.forEach((points, i) => {
            creationSource.set(points[0], points[1], points[2]);
            nodeRef.current.worldToLocal(creationSource);
            creationPath[i] = [creationSource.x, creationSource.y, creationSource.z];
        });
        creationPath.push(newPosition);
        entityPoseRef.current.creationPathRefs[instantiateEntityId] = React.createRef();
        entityPoseRef.current.creationPathRefs[instantiateEntityId].current = creationPath;

        entityPoseRef.current.radius[instantiateEntityId] = nextEntityRadiusRef.current;

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
        const physicsConfig1 = node1.ref.current.getPhysicsConfig();
        const body1radius = physicsConfig1.colliderRadius;
        const physicsConfig2 = node2.ref.current.getPhysicsConfig();
        const body2radius = physicsConfig2.colliderRadius;
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
        const unExpandAnchor = (anchor, radius) => {
            // Normalize the anchor vector
            const normalizedAnchor = anchor.clone().normalize();
            // Scale the normalized vector by the entityRadius
            const expansion = normalizedAnchor.multiplyScalar(radius * JOINT_EXPANSION);
            // Add the scaled vector to the original anchor
            anchor.sub(expansion);
        };

        unExpandAnchor(anchor1, nextEntityRadiusRef.current);
        unExpandAnchor(anchor2, nextEntityRadiusRef.current);

        createJoint(node.chainRef, body1Ref, anchor1, nextBodyRef, anchor2);
        addActiveJoint(body1Id, nextId);

        createJoint(node.chainRef, nextBodyRef, anchor1, body2Ref, anchor2);
        addActiveJoint(nextId, body2Id);

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
            centerRef.current = nodeRef.current.worldToLocal(worldCenterRef.current.clone());
        }
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
            frameCountRef.current = 0;
        } else {
            if (!pausePhysics) frameStateDurationRef.current += deltaTime;
        }

        calculateCenter(entityIdsCreatedRef.current);

        if (prevFrameStateRef.current !== frameStateRef.current) {
            //console.log("FrameState", frameStateRef.current);
        }

        if (structureChanging.current) {
            directResetParticlesHash();
        }

        prevFrameStateRef.current = frameStateRef.current

        const animDelay = config.animDelayMs / 1000;
        
        // State machine can distribute computation across frames, reducing load on the physics engine
        // Also provides the "growth" algorithm for the compoundEntity
        // Could be expanded to allow for adding/removing nodes
        switch (frameStateRef.current) {
            case "init": {
                if (id == "root" && !showParticles) {
                    // So we can see something while things are "growing"
                    setAppOption("showParticles", true);
                    // Will be used to restore the original setting after "grown"
                    initialShowParticlesRef.current = false;
                }
                frameStateRef.current = "selectNextEntity";
                break;
            }
            case "selectNextEntity": {
                // Add entities one by one
                const toInstantiateCount = entitiesToInstantiate.length;
                for (let i = 0; i < entityNodes.length; i++) {
                    const entityNodeId = entityNodes[i].id;
                    if (entitiesToInstantiate.includes(entityNodeId)) continue;
                    nextEntityIdRef.current = entityNodeId; // Not using state to value is available immediately
                    nextEntityRef.current = entityNodes[i];
                    nextEntityRadiusRef.current = getEntityRadius(nextEntityRef.current);
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
                    const expansion = normalizedAnchor.multiplyScalar(nextEntityRadiusRef.current * JOINT_EXPANSION);
                    return anchor.add(expansion);
                };
                joint.setAnchor1(expandAnchor(vec3(joint.anchor1())));
                joint.setAnchor2(expandAnchor(vec3(joint.anchor2())));
                frameStateRef.current = "waitForExpansion";
                break;
            }
            case "waitForExpansion": {
                if (frameStateDurationRef.current < animDelay) break;
                frameStateRef.current = "poseEntity";
                break;
            }
            case "poseEntity": {
                // After entityPose entitiesToInstantiate will have nextEntityIdRef.current appended
                entityPose(nextEntityIdRef.current);
                frameStateRef.current = "waitForCreation";
                break;
            }
            case "waitForCreation":  {
                // Update every x frames
                frameCountRef.current++;
                if (frameCountRef.current > 4) {
                    frameCountRef.current = 0;
                } else {
                    break;
                }
                // Is the rigid body reference available
                const particleRef = nextEntityRef.current.ref;
                if (particleRef?.current?.current) {
                    const physicsConfig = particleRef.current.getPhysicsConfig();
                    // Wait until particle is in place
                    if (!physicsConfig.isCreated) {
                        // Update the position of where the new entity should end up
                        const creationPathRef = entityPoseRef.current.creationPathRefs[nextEntityIdRef.current];
                        if (creationPathRef.current.length) {
                            // Because we have added an entity by now so subtract 1
                            const { newPosition } = positionAndOuter(entitiesToInstantiate.length - 1);
                            const lastPathIndex = creationPathRef.current.length - 1;
                            creationPathRef.current[lastPathIndex] = newPosition;
                        }
                    } else {
                        frameStateRef.current = "replaceJoint";
                    }
                }
                break;
            }
            case "replaceJoint": {
                // Is the rigid body reference available
                const particleRef = nextEntityRef.current.ref;
                entityIdsCreatedRef.current.push(nextEntityIdRef.current);
                frameStateRef.current = "replaceJoint";
                node.particlesRef.current.push(particleRef);
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
                        replaceJoint(nextEntityIdRef.current);
                        break;
                    }
                } 
                if (toInstantiateCount == entityCount) {
                    frameStateRef.current = "swapJoints";
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
            case "swapJoints": {
                swapJoints(parentJointsToRef, true);
                swapJoints(parentJointsFromRef, false);
                frameStateRef.current = "jointsSwapped";
                break;
            }
            case "jointsSwapped": {
                // Update the initialPositions based on current positions
                // This was creating issues when "dropping" particles into place
                // When the particle becomes a compoundEntity it will be in place
                entitiesToInstantiate.forEach((entityId, i) => {
                    const entityNode = directGetNode(entityId);
                    const position = vec3(entityNode.ref.current.translation());
                    nodeRef.current.worldToLocal(position);
                    entityPoseRef.current.position[entityId] = [position.x, position.y, position.z]; // Force Z to 0
                })
                if (id === "root") {
                    console.log("entityStore", config.entityStore);
                    setJointsMapped(true);
                    frameStateRef.current = "stableRoot";
                } else {
                    frameStateRef.current = "jointsMapped";
                }
                structureChanging.current = false;
                break;
            }
            case "stableRoot": {
                if (frameStateDurationRef.current < animDelay * 4) break;
                const hash = directGetParticlesHash(id);
                if (hash && prevParticlesHash.current !== hash) {
                    prevParticlesHash.current = hash;
                    frameStateDurationRef.current = 0;
                } else {
                    setAppOption("showParticles", initialShowParticlesRef.current);
                    console.log("showParticles", id, initialShowParticlesRef.current)
                    nodeRef.current.setPhysicsConfig(p => ({ ...p, visible: true }));
                    frameStateRef.current = "jointsMapped";
                }
                break;
            }
            case "jointsMapped":
                // The jointsMapped state may not be updated because not being rerendered
                if (!jointsMapped) {
                    setJointsMapped(true);
                }
                frameStateRef.current = "contractJoints";
                break;
            case "contractJoints": {
                if (contractJoints([...parentJointsToRef.current, ...parentJointsFromRef.current])) {
                    entitiesToInstantiate.forEach((entityId, i) => {
                        const entityNode = directGetNode(entityId);
                        entityNode.ref.current.setPhysicsConfig(p => ({ ...p, damping: 5 }));
                    })
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

    //console.log("CompoundEntity rendering", id, "frameState", frameStateRef.current, "initialPosition", initialPosition)
    //useWhyDidYouUpdate(`CompoundEntity ${id}`, {id, initialPosition, radius, debug, config, outer, config.initialCreationPath, ...props} );

    return (
        <group>

             <CompoundEntityGroup ref={nodeRef} position={initialPosition} quaternion={quaternion} id={id}>

                {entitiesToInstantiate.map((entityId, i) => {
                    let entity = directGetNode(entityId);
                    let EntityType = CompoundEntity;
                    if (entity.childrenIds.length === 0) {
                        EntityType = Particle;
                    } else if (!jointsMapped) {
                        EntityType = Particle;
                    }
                    let lockPose = (i === 0 && !jointsMapped) ? true : false;
                    // First particle replaces the compoundEntity particle in-place
                    const creationPathRef = (i === 0 && id !== "root") ? null : entityPoseRef.current.creationPathRefs[entityId];
                    return (
                        <EntityType
                            key={`${id}-${i}`}
                            id={`${entityId}`}
                            initialPosition={entityPoseRef.current.position[entityId]}
                            creationPathRef={creationPathRef}
                            radius={entityPoseRef.current.radius[entityId]}
                            color={color}
                            ref={entity.ref}
                            debug={isDebug}
                            config={config}
                            jointsTo={jointsToRef.current[entity.id] || []}
                            jointsFrom={jointsFromRef.current[entity.id] || []}
                            quaternion={entityPoseRef.current.orientation[entityId]}
                            outer={entityPoseRef.current.outer[entityId]}
                            lockPose={lockPose}
                            index={i}
                        />
                    )
                })}

                {jointsMapped && !hideBlobs && (
                    <Blob
                        color={color}
                        node={node}
                        entityNodes={entityNodes}
                        config={config}
                    />
                )}

                {id === "root" && config.showRelations && (
                    <Relations
                        node={node}
                        config={config}
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