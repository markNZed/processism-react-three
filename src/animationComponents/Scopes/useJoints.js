import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useRapier, vec3 } from '@react-three/rapier';
import useEntityStore from './useEntityStore';

const useJoints = (
    particleJointsRef,
    jointRefsRef,
    particleRadiusRef,
    chainRef,
    frameStateRef,
    id,
    config,
    internalRef,
    entityPositions,
    scope,
    entityParticlesRefsRef,
) => {

    const { world, rapier } = useRapier();
    const { getEntityRefs } = useEntityStore(state => ({
        getEntityRefs: state.getEntityRefs,
    }));

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

    const createJoint = (a, b, id) => {
        const aUserData = a.ref.userData || a.ref.getUserData();
        const bUserData = b.ref.userData || b.ref.getUserData();
        const jointRefsRefIndex = `${aUserData.uniqueIndex}-${bUserData.uniqueIndex}`;
        const jointRef = { current: null }; // Create a plain object to hold the reference
        jointRef.current = world.createImpulseJoint(
            rapier.JointData.spherical(a.offset, b.offset),
            a.ref,
            b.ref,
            true
        );
        jointRefsRef.current[jointRefsRefIndex] = jointRef;
        particleJointsRef.current[aUserData.uniqueIndex].push(jointRefsRefIndex);
        console.log("createJoint", id, jointRefsRefIndex, jointRef);
        return jointRef;
    };

    const removeJoint = (jointKey) => {
        const jointRef = jointRefsRef.current[jointKey];
        const body1 = jointRef.current.body1();
        const body2 = jointRef.current.body2();
        let body1Joints = particleJointsRef.current[body1.userData.uniqueIndex];
        let body2Joints = particleJointsRef.current[body2.userData.uniqueIndex];
        body1Joints = body1Joints.filter(obj => obj !== jointKey);
        body2Joints = body2Joints.filter(obj => obj !== jointKey);
        particleJointsRef.current[body1.userData.uniqueIndex] = body1Joints;
        particleJointsRef.current[body2.userData.uniqueIndex] = body2Joints;
        if (jointRef.current) {
            const joint = jointRef.current;
            jointRef.current = undefined;
            if (world.getImpulseJoint(joint.handle)) {
                world.removeImpulseJoint(joint, true);
            }
            delete jointRefsRef.current[jointKey];
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

    const allocateJointsToParticles = (entityParticlesRefsRef, jointsData, internalRef) => {
        const worldPosition = new THREE.Vector3();
        internalRef.current.getWorldPosition(worldPosition);
        const particleWorldPosition = new THREE.Vector3();

        const allocateJoints = jointsData.map((jointData, i) => {

            function findClosestParticle(entityParticlesRefsRef, jointData, worldPosition, excludedEntityIndex) {
                let minDistance = Infinity;
                let closestParticleIndex = -1;
                let closestParticlePosition = new THREE.Vector3();
                let particleEntityIndex = -1;
                let closestParticleRef;

                entityParticlesRefsRef.current.forEach((entity, entityIndex) => {
                    if (entityIndex === excludedEntityIndex) return;
                    entity.current.forEach((particleRef, j) => {
                        const pos = particleRef.current.translation();
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
                            closestParticleRef = particleRef;
                        }
                    });
                });

                return { minDistance, closestParticleIndex, closestParticlePosition, particleEntityIndex, closestParticleRef };
            }

            const resultA = findClosestParticle(entityParticlesRefsRef, jointData, worldPosition, -1);
            const closestParticleAPosition = resultA.closestParticlePosition;
            const particleAEntityIndex = resultA.particleEntityIndex;
            const closestParticleARef = resultA.closestParticleRef;

            const resultB = findClosestParticle(entityParticlesRefsRef, jointData, worldPosition, particleAEntityIndex);
            const closestParticleBPosition = resultB.closestParticlePosition;
            const closestParticleBRef = resultB.closestParticleRef;

            const direction = new THREE.Vector3()
                .subVectors(closestParticleBPosition, closestParticleAPosition)
                .normalize();

            const offsetA = direction.clone().multiplyScalar(particleRadiusRef.current);
            const offsetB = direction.clone().multiplyScalar(-particleRadiusRef.current);

            const uniqueIndexA = closestParticleARef.current.userData.uniqueIndex;
            const uniqueIndexB = closestParticleBRef.current.userData.uniqueIndex;

            if (chainRef.current[uniqueIndexA]) {
                if (!chainRef.current[uniqueIndexA].includes(uniqueIndexB)) {
                    chainRef.current[uniqueIndexA].push(uniqueIndexB);
                }
            } else {
                chainRef.current[uniqueIndexA] = [uniqueIndexB];
            }
            if (chainRef.current[uniqueIndexB]) {
                if (!chainRef.current[uniqueIndexB].includes(uniqueIndexA)) {
                    chainRef.current[uniqueIndexB].push(uniqueIndexA);
                }
            } else {
                chainRef.current[uniqueIndexB] = [uniqueIndexA];
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

    const initializeJoints = (flattenedParticleRefs, initialPosition) => {
        const centerRef = new THREE.Vector3();
        centerRef.current = internalRef.current.localToWorld(vec3(initialPosition));
        const firstJointData = jointsData[0];
        const firstJointPosition = new THREE.Vector3(firstJointData.position.x, firstJointData.position.y, firstJointData.position.z);
        const distanceToFirstJoint = centerRef.current.distanceTo(internalRef.current.localToWorld(firstJointPosition));
        
        flattenedParticleRefs.current.forEach(particleRef => {
            const particlePosition = particleRef.current.translation();
            const particleVector = new THREE.Vector3(particlePosition.x, particlePosition.y, particlePosition.z);
            const distanceToCenter = centerRef.current.distanceTo(particleVector);
            if (!particleRef.current.userData.scopeOuter) {
                particleRef.current.userData.scopeOuter = {};
            }
            const offset = [-0.2, -0.2, 0];
            let outer = distanceToCenter >= (distanceToFirstJoint + offset[scope]);
            particleRef.current.userData.scopeOuter[scope] = outer;
            //if (scope ==0 && outer) particleRef.current.userData.color = "black";
        });

        const newJoints = allocateJointsToParticles(entityParticlesRefsRef, jointsData, internalRef);
        newJoints.forEach((particles, i) => {
            const aIndex = particles.a.ref.current.userData.uniqueIndex;
            const bIndex = particles.b.ref.current.userData.uniqueIndex;
            const jointIndex = `${aIndex}-${bIndex}`;
            if (particleJointsRef.current[aIndex]) {
                if (!particleJointsRef.current[aIndex].includes(jointIndex)) {
                    particleJointsRef.current[aIndex].push(jointIndex);
                }
            } else {
                particleJointsRef.current[aIndex] = [jointIndex];
            }
            if (particleJointsRef.current[bIndex]) {
                if (!particleJointsRef.current[bIndex].includes(jointIndex)) {
                    particleJointsRef.current[bIndex].push(jointIndex);
                }
            } else {
                particleJointsRef.current[bIndex] = [jointIndex];
            }
        });
        return newJoints;
    };

    // Experimenting on how to migrate an entity
    // Start with single particle
    // Need to remove the entity from CompoundEntity center calculations - where does it belong?
    // Could maintain a list of "detached" particles at the CompoundEntity level (can filter for center calc)
    // Adding an entity to a CompoundEntity will also be a challenge e.g. array sizes change
    //   What needs to change ? 
    //     entityCount, entityParticlesRefsRef, flattenedParticleRefs, entityPositions, jointsData, 
    //     entitiesRegisteredRef, particlesRegisteredRef, newJoints, particleJointsRef
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
            // With "Scope-3" this is at scope 1 so userData.uniqueIndex is e.g. "Scope-3-5" not a Particle index
            if (frameStateRef.current !== "init" && id == "Scope-8-3") {
                // Randomly select an entity from this CompoundEntity
                const randomIndexFrom = 1; //Math.floor(Math.random() * entityCount);
                const entityRef = getEntityRefs(randomIndexFrom);
                const userData = entityRef.current.getUserData();
                const entityUniqueIndex = userData.uniqueIndex;
                const entityJointIndexes = particleJointsRef.current[entityUniqueIndex];
                let replacementEntity;
                let closestIndex;
                let closestDistance = Infinity;
                // Create a new Vector3 to store the world position of this CompoundEntity
                const worldPosition = new THREE.Vector3();
                internalRef.current.getWorldPosition(worldPosition);
                // Vector3 to be used for particle world position
                const particleWorldPosition = new THREE.Vector3();
                entityJointIndexes.forEach((jointKey) => {
                    const jointRef = jointRefsRef.current[jointKey];
                    const body1 = jointRef.current.body1();
                    const body2 = jointRef.current.body2();
                    // Entity needs to store parent entity in userData ?
                    // Find the entity which is closest to the center of this CompoundEntity
                    function replaceEntity(body, entityUniqueIndex) {
                        if (body.userData.uniqueIndex === entityUniqueIndex) return false;
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
                        closestIndex = body1.userData.uniqueIndex;
                    }
                    if (replaceEntity(body2, entityUniqueIndex)) {
                        replacementEntity = body2;
                        closestIndex = body2.userData.uniqueIndex;
                    }
                    //console.log("Joint anchors", jointKey, a1, body1, a2, body2);
                });
                console.log("Detach a random entity", id, entityUniqueIndex, entityRef, "closestIndex", closestIndex, "replacementEntity", replacementEntity);
                const jointsToCreate = [];
                entityJointIndexes.forEach((jointKey) => {
                    const jointRef = jointRefsRef.current[jointKey];
                    let body1 = jointRef.current.body1();
                    let body2 = jointRef.current.body2();
                    if (replacementEntity.userData.uniqueIndex == body1.userData.uniqueIndex) return;
                    if (replacementEntity.userData.uniqueIndex == body2.userData.uniqueIndex) return;
                    if (body1.userData.uniqueIndex === entityUniqueIndex) {
                        body1 = replacementEntity;
                    }
                    if (body2.userData.uniqueIndex === entityUniqueIndex) {
                        body2 = replacementEntity;
                    }
                    // Can't just copy the offset, need to recalculate them. Create a function for this ?
                    // The radius of the replacement may not be the same...
                    const { offset1, offset2 } = calculateJointOffsets(body1, body2, particleRadiusRef.current);
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
                    const newJointRef = createJoint(a, b);
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