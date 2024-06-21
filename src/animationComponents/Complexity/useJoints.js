import * as THREE from 'three';
import { useRapier, vec3 } from '@react-three/rapier';
import useStoreEntity from './useStoreEntity';
import useStoreJoint from './useStoreJoint';
import * as utilsJoints from './utilsJoints.js';

// Remember custom hook can generate renders in the Component so be careful with Zustand stores

const useJoints = () => {

    const { world, rapier } = useRapier();
    // Be careful not to have this sensitive to updates to nodes
    // Direct access to the state outside of React's render flow
    const directGetNodeProperty = useStoreEntity.getState().getNodeProperty;
    const directGetAllParticleRefs = useStoreEntity.getState().getAllParticleRefs;
    const directAddJoints = useStoreJoint.getState().addJoints;
    const particleRadius = directGetNodeProperty('root', 'particleRadius');

    const allocateJointsToParticles = (node, chainRef, entityPositions) => {
        const nodeRef = node.ref;
        const worldPosition = new THREE.Vector3();
        nodeRef.current.getWorldPosition(worldPosition);
        const particleWorldPosition = new THREE.Vector3();

        const entitiesParticlesRefs = [];
        node.childrenIds.forEach(childId => {
            entitiesParticlesRefs.push(directGetAllParticleRefs(childId))
        });

        const jointsData = generateJointsData(entityPositions);

        const allocatedJoints = jointsData.map((jointData, i) => {

            // The data is organized into entities to ensure the second closet particle is in a different entity
            // Would be good to not need the data structure din this way
            // Could loop over entities instead of entitiesParticlesRefs ?

            const resultA = findClosestParticle(entitiesParticlesRefs, jointData, worldPosition, null, particleWorldPosition);
            const closestParticleAPosition = resultA.closestParticlePosition;
            const particleAEntityIndex = resultA.particleEntityIndex;
            const closestParticleARef = resultA.closestParticleRef;

            const resultB = findClosestParticle(entitiesParticlesRefs, jointData, worldPosition, particleAEntityIndex, particleWorldPosition);
            const closestParticleBPosition = resultB.closestParticlePosition;
            const closestParticleBRef = resultB.closestParticleRef;

            const direction = new THREE.Vector3()
                .subVectors(closestParticleBPosition, closestParticleAPosition)
                .normalize();

            const offsetA = direction.clone().multiplyScalar(particleRadius);
            const offsetB = direction.clone().multiplyScalar(-particleRadius);

            const uniqueIdA = closestParticleARef.getVisualConfig().uniqueId;
            const uniqueIdB = closestParticleBRef.getVisualConfig().uniqueId;

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
        return allocatedJoints;
    };

    const initializeJoints = (node, entityPositions) => {
        const scope = node.depth;
        const nodeRef = node.ref;
        const chainRef = node.chainRef;
        const centerRef = new THREE.Vector3();
        centerRef.current = nodeRef.current.localToWorld(vec3(node.initialPosition));

        const newJoints = allocateJointsToParticles(node, chainRef, entityPositions);
        // Prepare the updates first by aggregating them into a single array
        const allNewJoints = newJoints.reduce((acc, particles) => {
            const aIndex = particles.a.ref.getVisualConfig().uniqueId;
            const bIndex = particles.b.ref.getVisualConfig().uniqueId;
            const jointIndex = `${aIndex}-${bIndex}`;
            const jointIndexReverse = `${bIndex}-${aIndex}`;
            // Add both the joint index and its reverse to the accumulator
            return [...acc, jointIndex, jointIndexReverse];
        }, []);

        // Distance to the first joint
        // We place the joints first because they will not align with the perimeter of the scope
        const jointPosition = newJoints[0].a.ref.translation();
        const jointPositionVector = new THREE.Vector3(jointPosition.x, jointPosition.y, jointPosition.z);
        const distanceToFirstJoint = centerRef.current.distanceTo(jointPositionVector) - particleRadius;

        node.particlesRef.current.forEach(particleRef => {
            const particlePosition = particleRef.current.translation();
            const particleVector = new THREE.Vector3(particlePosition.x, particlePosition.y, particlePosition.z);
            const distanceToCenter = centerRef.current.distanceTo(particleVector);
            const visualConfig = particleRef.current.getVisualConfig();
            if (!visualConfig.outerChain) visualConfig.outerChain = {};
            let outer = distanceToCenter >= (distanceToFirstJoint);
            visualConfig.outerChain[scope] = outer
            particleRef.current.setVisualConfig(visualConfig);
            // To debug the chains of particles
            //if (scope == 1 && outer) particleRef.current.getVisualConfig().color = "black";
        });

        // Create the joints
        const createJointResults = []
        newJoints.forEach((particles) => {
            // Offset needs to be in local coordinates - should be OK for 
            const a = {
                ref: particles.a.ref,
                offset: particles.a.offset,
            }
            const b = {
                ref: particles.b.ref,
                offset: particles.b.offset,
            }
            createJointResults.push(utilsJoints.createJoint(world, rapier, a, b, node.depth, true));
        });
        directAddJoints(createJointResults); // Because batch operation
        const jointIndexes = createJointResults.map(([id1, id2, ref]) => {
            return id1;
        })
        node.jointsRef.current = jointIndexes;
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

function findClosestParticle(entitiesParticlesRefs, jointData, worldPosition, excludedEntityIndex, particleWorldPosition) {
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