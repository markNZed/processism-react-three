import * as THREE from 'three';
import { useRapier, vec3 } from '@react-three/rapier';
import useStoreEntity from './useStoreEntity';
import useStoreScope from './useStoreScope';
import useStoreJoint from './useStoreJoint';
import * as utilsJoints from './utilsJoints.js';

// Remember custom hook can generate renders in the Component so be careful with Zustand stores

const useJoints = () => {

    //if (!initialized) return () => null;

    const { world, rapier } = useRapier();
    // Be careful not to have this sensitive to updates to nodes
    // Direct access to the state outside of React's render flow
    const updateNode = useStoreEntity.getState().updateNode;
    const getNodeProperty = useStoreEntity.getState().getNodeProperty;
    const getAllParticleRefs = useStoreEntity.getState().getAllParticleRefs;
    const particleRadiusRef = getNodeProperty('root', 'particleRadiusRef');
    const updateScope = useStoreScope.getState().updateScope;
    const addJoints = useStoreJoint.getState().addJoints;

    const allocateJointsToParticles = (entitiesParticlesRefs, jointsData, internalRef, chainRef) => {
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

    const initializeJoints = (node, entityPositions) => {
        const id = node.id;
        const scope = node.depth;
        const internalRef = node.ref;
        const chainRef = node.chainRef;
        const centerRef = new THREE.Vector3();
        centerRef.current = internalRef.current.localToWorld(vec3(node.initialPosition));
        const entitiesParticlesRefs = [];
        node.childrenIds.forEach(childId => {
            entitiesParticlesRefs.push(getAllParticleRefs(childId))
        });
        const jointsData = generateJointsData(entityPositions);

        const newJoints = allocateJointsToParticles(entitiesParticlesRefs, jointsData, internalRef, chainRef);
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
            createJointResults.push(utilsJoints.createJoint(world, rapier, a, b, node.depth, true));
        });
        addJoints(createJointResults); // Because batch operation
        const jointIndexes = createJointResults.map((id1, id2, ref) => {
            return id1;
        })
        updateNode(id, p => ({
            joints: jointIndexes
        }));
    };

    return initializeJoints;
};

export default useJoints;

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
