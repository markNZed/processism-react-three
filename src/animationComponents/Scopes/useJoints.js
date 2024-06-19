import { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useRapier, vec3 } from '@react-three/rapier';
import useStoreEntity from './useStoreEntity';
import useStoreScope from './useStoreScope';
import useStoreJoint from './useStoreJoint';

const useJoints = (
    initialized,
    entityPositions,
    node,
    entityNodes,
) => {

    const { world, rapier } = useRapier();
    // Be careful not to have this sensitive to updates to nodes
    // Direct access to the state outside of React's render flow
    const updateNode = useStoreEntity.getState().updateNode;
    const getNodeProperty = useStoreEntity.getState().getNodeProperty;
    const getAllParticleRefs = useStoreEntity.getState().getAllParticleRefs;
    const particleRadiusRef = getNodeProperty('root', 'particleRadiusRef');
    const updateScope = useStoreScope.getState().updateScope;
    const getJoint = useStoreJoint.getState().getJoint;
    const addJoint = useStoreJoint.getState().addJoint;
    const addJoints = useStoreJoint.getState().addJoints;
    const removeJointStore = useStoreJoint.getState().removeJoint;
    const id = node.id;
    const scope = node.depth;
    const config = node.config;
    const internalRef = node.ref;
    const chainRef = node.chainRef;

    const entityRefs = entityNodes.map(entity => entity.ref);

    // Return the center point of all the joints
    const generateJointsData = (positions) => {
        const jointsData = positions.map((pos, i) => {
            let nextPos;
            if (i == positions.length - 1) {
                nextPos = positions[0];
            } else {
                nextPos = positions[i + 1];
            }

            // Calculate midpoint
            const midX = (pos.x + nextPos.x) / 2;
            const midY = (pos.y + nextPos.y) / 2;
            const midZ = (pos.z + nextPos.z) / 2;

            return {
                position: {
                    x: midX,
                    y: midY,
                    z: midZ,
                },
            };
        });
        return jointsData;
    };

    const jointsData = useMemo(() => {
        return generateJointsData(entityPositions);
    }, [entityPositions]);

    const createJoint = (a, b, batch=false) => {
        const aUserData = a.ref.userData || a.ref.getUserData();
        const bUserData = b.ref.userData || b.ref.getUserData();
        const jointRefsRefIndex = `${aUserData.uniqueId}-${bUserData.uniqueId}`;
        const jointRefsRefIndexReverse = `${bUserData.uniqueId}-${aUserData.uniqueId}`;
        const jointRef = { current: null }; // Create a plain object to hold the reference
        jointRef.current = world.createImpulseJoint(
            rapier.JointData.spherical(a.offset, b.offset),
            a.ref,
            b.ref,
            true
        );
        if (!batch) {
            addJoint(jointRefsRefIndex, jointRef);
            addJoint(jointRefsRefIndexReverse, jointRef);
            updateNode(aUserData.uniqueId, p => ({
                joints: p.joints.includes(jointRefsRefIndex) ? p.joints : [...p.joints, jointRefsRefIndex]
            }));
            updateScope(scope, p => ({
                joints: [...p.joints, jointRefsRefIndex, jointRefsRefIndexReverse]
            }));
        }
        //console.log("createJoint", id, jointRefsRefIndex, jointRef);
        return [jointRefsRefIndex, jointRefsRefIndexReverse, jointRef];
    };

    const removeJoint = (jointKey) => {
        const jointRef = getJoint(jointKey);
        const body1 = jointRef.current.body1();
        const body2 = jointRef.current.body2();
        let body1Joints = getNodeProperty(body1.userData.uniqueId, joints);
        let body2Joints = getNodeProperty(body2.userData.uniqueId, joints);
        body1Joints = body1Joints.filter(obj => obj !== jointKey);
        body2Joints = body2Joints.filter(obj => obj !== jointKey);
        updateNode(body1.userData.uniqueId, {joints: body1Joints});
        updateNode(body2.userData.uniqueId, {joints: body2Joints});
        const jointIndex = `${body1.userData.uniqueId}-${body2.userData.uniqueId}`;
        const jointIndexReverse = `${body2.userData.uniqueId}-${body1.userData.uniqueId}`;
        updateScope(scope, p => ({
            joints: p.joints.filter(joint => joint !== jointIndex && joint !== jointIndexReverse)
        }));
        if (jointRef.current) {
            const joint = jointRef.current;
            jointRef.current = undefined;
            if (world.getImpulseJoint(joint.handle)) {
                world.removeImpulseJoint(joint, true);
            }
            removeJointStore(jointKey);
        }
    };

    const calculateJointOffsets = (body1, body2, particleRadius) => {
        const body1position = body1.translation();
        const body2position = body2.translation();
        const direction = new THREE.Vector3()
            .subVectors(body1position, body2position)
            .normalize();
        const offset1 = direction.clone().multiplyScalar(-particleRadius);
        const offset2 = direction.clone().multiplyScalar(particleRadius);
        return { offset1, offset2 };
    };

    const allocateJointsToParticles = (entitiesParticlesRefs, jointsData, internalRef) => {
        const worldPosition = new THREE.Vector3();
        internalRef.current.getWorldPosition(worldPosition);
        const particleWorldPosition = new THREE.Vector3();

        const allocateJoints = jointsData.map((jointData, i) => {

            function findClosestParticle(entitiesParticlesRefs, jointData, worldPosition, excludedEntityIndex) {
                let minDistance = Infinity;
                let closestParticleIndex = -1;
                let closestParticlePosition = new THREE.Vector3();
                let particleEntityIndex = -1;
                let closestParticleRef;

                entitiesParticlesRefs.forEach((entityRefs, entityIndex) => {
                    if (entityIndex === excludedEntityIndex) return;
                    entityRefs.forEach((particleRef, j) => {
                        const pos = particleRef.current.current.translation();
                        particleWorldPosition.set(pos.x, pos.y, pos.z);
                        const distance = particleWorldPosition.distanceTo(new THREE.Vector3(
                            jointData.position.x + worldPosition.x,
                            jointData.position.y + worldPosition.y,
                            jointData.position.z + worldPosition.z
                        ));
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestParticleIndex = j;
                            closestParticlePosition.copy(particleWorldPosition);
                            particleEntityIndex = entityIndex;
                            closestParticleRef = particleRef.current;
                        }
                    });
                });

                return { minDistance, closestParticleIndex, closestParticlePosition, particleEntityIndex, closestParticleRef };
            }

            const resultA = findClosestParticle(entitiesParticlesRefs, jointData, worldPosition, null);
            const closestParticleAPosition = resultA.closestParticlePosition;
            const particleAEntityIndex = resultA.particleEntityIndex;
            const closestParticleARef = resultA.closestParticleRef;

            const resultB = findClosestParticle(entitiesParticlesRefs, jointData, worldPosition, particleAEntityIndex);
            const closestParticleBPosition = resultB.closestParticlePosition;
            const closestParticleBRef = resultB.closestParticleRef;

            const direction = new THREE.Vector3()
                .subVectors(closestParticleBPosition, closestParticleAPosition)
                .normalize();

            const offsetA = direction.clone().multiplyScalar(particleRadiusRef);
            const offsetB = direction.clone().multiplyScalar(-particleRadiusRef);

            const uniqueIdA = closestParticleARef.current.userData.uniqueId;
            const uniqueIdB = closestParticleBRef.current.userData.uniqueId;

            if (chainRef.current[uniqueIdA]) {
                if (!chainRef.current[uniqueIdA].includes(uniqueIdB)) {
                    chainRef.current[uniqueIdA].push(uniqueIdB);
                }
            } else {
                chainRef.current[uniqueIdA] = [uniqueIdB];
            }
            if (chainRef.current[uniqueIdB]) {
                if (!chainRef.current[uniqueIdB].includes(uniqueIdA)) {
                    chainRef.current[uniqueIdB].push(uniqueIdA);
                }
            } else {
                chainRef.current[uniqueIdB] = [uniqueIdA];
            }

            return {
                a: {
                    ref: closestParticleARef,
                    offset: offsetA
                },
                b: {
                    ref: closestParticleBRef,
                    offset: offsetB
                },
            };
        });
        return allocateJoints;
    };

    const initializeJoints = useCallback((initialPosition) => {
        const centerRef = new THREE.Vector3();
        centerRef.current = internalRef.current.localToWorld(vec3(initialPosition));
        const entitiesParticlesRefs = [];
        node.childrenIds.forEach(childId => {
            entitiesParticlesRefs.push(getAllParticleRefs(childId))
        });

        const newJoints = allocateJointsToParticles(entitiesParticlesRefs, jointsData, internalRef);
        // Prepare the updates first by aggregating them into a single array
        const allNewJoints = newJoints.reduce((acc, particles) => {
            const aIndex = particles.a.ref.current.userData.uniqueId;
            const bIndex = particles.b.ref.current.userData.uniqueId;
            const jointIndex = `${aIndex}-${bIndex}`;
            const jointIndexReverse = `${bIndex}-${aIndex}`;
            // Add both the joint index and its reverse to the accumulator
            return [...acc, jointIndex, jointIndexReverse];
        }, []);

        // Perform the update in one go
        updateScope(scope, p => ({
            joints: [...p.joints, ...allNewJoints]
        }));

        // Distance to the first joint
        // We place the joints first because they will not align with the perimeter of the scope
        const jointPosition = newJoints[0].a.ref.translation();
        const jointPositionVector = new THREE.Vector3(jointPosition.x, jointPosition.y, jointPosition.z);
        const distanceToFirstJoint = centerRef.current.distanceTo(jointPositionVector) - particleRadiusRef;

        node.particlesRef.current.forEach(particleRef => {
            const particlePosition = particleRef.current.translation();
            const particleVector = new THREE.Vector3(particlePosition.x, particlePosition.y, particlePosition.z);
            const distanceToCenter = centerRef.current.distanceTo(particleVector);
            const userData = particleRef.current.getUserData();
            if (!userData.scopeOuter) userData.scopeOuter = {};
            let outer = distanceToCenter >= (distanceToFirstJoint);
            userData.scopeOuter[scope] = outer
            particleRef.current.setUserData(userData);
            //if (scope == 1 && outer) particleRef.current.userData.color = "black";
        });

        // Create the joints
        const createJointResults = []
        newJoints.forEach((particles) => {
            //const { offset1, offset2 } = calculateJointOffsets(particles.a.ref.current, particles.b.ref.current, particleRadiusRef);
            // Offset needs to be in local coordinates - should be OK for 
            const a = {
                ref: particles.a.ref.current,
                offset: particles.a.offset,
            }
            const b = {
                ref: particles.b.ref.current,
                offset: particles.b.offset,
            }
            createJointResults.push(createJoint(a, b, true));
        });
        addJoints(createJointResults); // Because batch operation
        const jointIndexes = createJointResults.map((id1, id2, ref) => {
            return id1;
        })
        updateNode(id, p => ({
            joints: jointIndexes
        }));
    }, [jointsData, particleRadiusRef]);

    // Experimenting on how to migrate an entity
    // Start with single particle
    // Need to remove the entity from CompoundEntity center calculations - where does it belong?
    // Could maintain a list of "detached" particles at the CompoundEntity level (can filter for center calc)
    // Adding an entity to a CompoundEntity will also be a challenge e.g. array sizes change
    //   What needs to change ? 
    //     entityCount, entitiesParticlesRefsRef, particleRefs, entityPositions, jointsData, 
    //     entitiesRegisteredRef, particlesRegisteredRef, newJoints
    //   Zustand might be able to store refs when we useRef but not sure that has advantages
    //   Data structures that require remounting could be in Zustand
    //   The entityid could be a unique id that is generated from a singleton rather than ordered.
    //   Work on dynamic change of entityCounts from GUI
    //     When config changes it should impact all Components as it is a prop
    // Could have a "move" entity command that is similar to getEntityRefFn so from anywhere we can call
    // moveEntityFn and it would find the entity and detach it then find the destination and attach it

    useEffect(() => {
        if (!config.detach) return
        // Generate a random number between 1000 and 10000 which determines the duration of relations
        const randomDuration = 1000; //Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
        const interval = setInterval(() => {
            // With "Scope-3" this is at scope 1 so userData.uniqueId is e.g. "Scope-3-5" not a Particle index
            if (initialized && id == "Scope-8-3") {
                // Randomly select an entity from this CompoundEntity
                const randomIndexFrom = 1; //Math.floor(Math.random() * entityCount);
                const entityRef = entityRefs(randomIndexFrom);
                const userData = entityRef.current.getUserData();
                const entityUniqueIndex = userData.uniqueId;
                const entityJointIndexes = getNodeProperty(entityUniqueIndex, joints);
                let replacementEntity;
                let closestIndex;
                let closestDistance = Infinity;
                // Create a new Vector3 to store the world position of this CompoundEntity
                const worldPosition = new THREE.Vector3();
                internalRef.current.getWorldPosition(worldPosition);
                // Vector3 to be used for particle world position
                const particleWorldPosition = new THREE.Vector3();
                entityJointIndexes.forEach((jointKey) => {
                    const jointRef = getJoint(jointKey);
                    const body1 = jointRef.current.body1();
                    const body2 = jointRef.current.body2();
                    // Entity needs to store parent entity in userData ?
                    // Find the entity which is closest to the center of this CompoundEntity
                    function replaceEntity(body, entityUniqueIndex) {
                        if (body.userData.uniqueId === entityUniqueIndex) return false;
                        const pos = body.translation();
                        particleWorldPosition.set(pos.x, pos.y, pos.z);
                        const distance = particleWorldPosition.distanceTo(particleWorldPosition);
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            return true
                        } else {
                            return false;
                        }
                    }
                    if (replaceEntity(body1, entityUniqueIndex)) {
                        replacementEntity = body1;
                        closestIndex = body1.userData.uniqueId;
                    }
                    if (replaceEntity(body2, entityUniqueIndex)) {
                        replacementEntity = body2;
                        closestIndex = body2.userData.uniqueId;
                    }
                    //console.log("Joint anchors", jointKey, a1, body1, a2, body2);
                });
                console.log("Detach a random entity", id, entityUniqueIndex, entityRef, "closestIndex", closestIndex, "replacementEntity", replacementEntity);
                const jointsToCreate = [];
                entityJointIndexes.forEach((jointKey) => {
                    const jointRef = getJoint(jointKey);
                    let body1 = jointRef.current.body1();
                    let body2 = jointRef.current.body2();
                    if (replacementEntity.userData.uniqueId == body1.userData.uniqueId) return;
                    if (replacementEntity.userData.uniqueId == body2.userData.uniqueId) return;
                    if (body1.userData.uniqueId === entityUniqueIndex) {
                        body1 = replacementEntity;
                    }
                    if (body2.userData.uniqueId === entityUniqueIndex) {
                        body2 = replacementEntity;
                    }
                    // Can't just copy the offset, need to recalculate them. Create a function for this ?
                    // The radius of the replacement may not be the same...
                    const { offset1, offset2 } = calculateJointOffsets(body1, body2, particleRadiusRef);
                    // Offset needs to be in local coordinates - should be OK for 
                    const a = {
                        ref: body1,
                        offset: offset1,
                    }
                    const b = {
                        ref: body2,
                        offset: offset2,
                    }
                    jointsToCreate.push([a, b]);
                });
                entityJointIndexes.forEach((jointKey) => {
                    removeJoint(jointKey);
                    console.log("removeJoint", jointKey);
                });
                jointsToCreate.forEach(([a, b]) => {
                    a.ref.userData.color = 'orange';
                    b.ref.userData.color = 'orange';
                    createJoint(a, b);
                })
            }
            clearInterval(interval);
        }, randomDuration);
        return () => {
            clearInterval(interval); // Cleanup interval on component unmount
        }
    }, []);

    return {
        jointsData,
        initializeJoints,
    };
};

export default useJoints;