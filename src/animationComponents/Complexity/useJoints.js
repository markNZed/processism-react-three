import * as THREE from 'three';
import { useRapier, vec3 } from '@react-three/rapier';
import useStoreEntity from './useStoreEntity';
import * as utils from './utils';

// Remember custom hook can generate renders in the Component so be careful with Zustand stores

const useJoints = () => {

    const { world, rapier } = useRapier();
    // Be careful not to have this sensitive to updates to nodes
    // Direct access to the state outside of React's render flow
    const { getJoint: directGetJoint,
            addJoint: directAddJoint, 
            deleteJoint: storeDeleteJoint,
            updateJoint: directUpdateJoint,
            getAllParticleRefs: directGetAllParticleRefs } = useStoreEntity.getState();

    const addLink = (chainRef, uniqueIdA, uniqueIdB) => {
        //console.log("Before addLink", JSON.stringify(chainRef.current), uniqueIdA, uniqueIdB);
        if (chainRef.current[uniqueIdA]) {
            if (!chainRef.current[uniqueIdA].includes(uniqueIdB)) chainRef.current[uniqueIdA].push(uniqueIdB);
        } else {
            chainRef.current[uniqueIdA] = [uniqueIdB];
        }
    }

    const removeLink = (chainRef, uniqueIdA, uniqueIdB) => {
        console.log("removeLink", uniqueIdA, uniqueIdB);
        if (chainRef.current[uniqueIdA]) {
            chainRef.current[uniqueIdA] = chainRef.current[uniqueIdA].filter(id => id !== uniqueIdB);
        }
    }

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
            const particleARadius = closestParticleARef.current.getVisualConfig().radius;

            const resultB = findClosestParticle(entitiesParticlesRefs, jointData, worldPosition, particleAEntityIndex, particleWorldPosition);
            const closestParticleBPosition = resultB.closestParticlePosition;
            const closestParticleBRef = resultB.closestParticleRef;
            const particleBRadius = closestParticleBRef.current.getVisualConfig().radius;

            const direction = new THREE.Vector3()
                .subVectors(closestParticleBPosition, closestParticleAPosition)
                .normalize();

            const offsetA = direction.clone().multiplyScalar(particleARadius);
            const offsetB = direction.clone().multiplyScalar(-particleBRadius);

            if (!closestParticleARef) {
                console.log("!closestParticleARef", node)
            }

            const uniqueIdA = closestParticleARef.getVisualConfig().uniqueId;
            const uniqueIdB = closestParticleBRef.getVisualConfig().uniqueId;

            addLink(chainRef, uniqueIdA, uniqueIdB);

            return [closestParticleARef, offsetA, closestParticleBRef, offsetB];
        });
        return allocatedJoints;
    };

    const createJoint = (chainRef, aRef, aOffset, bRef, bOffset, batch=false) => {
        const aVisualConfig = aRef.getVisualConfig();
        const bVisualConfig = bRef.getVisualConfig();
        const jointRef = { current: null }; // Create a plain object to hold the reference
        jointRef.current = world.createImpulseJoint(
            rapier.JointData.spherical(aOffset, bOffset),
            aRef.current,
            bRef.current,
            true
        );
        addLink(chainRef, aVisualConfig.uniqueId, bVisualConfig.uniqueId);
        if (!batch) {
            directAddJoint(aVisualConfig.uniqueId, bVisualConfig.uniqueId, jointRef);
        }
        console.log("createJoint", `${aVisualConfig.uniqueId}-${bVisualConfig.uniqueId}`, jointRef.current)
        return jointRef;
    };
    
    const deleteJoint = (chainRef, jointKey) => {
        //console.log("deleteJoint", jointKey)
        const [jointRef, body1Id, body2Id] = directGetJoint(jointKey);
        if (jointRef.current) {
            const joint = jointRef.current;
            jointRef.current = undefined;
            if (world.getImpulseJoint(joint.handle)) {
                world.removeImpulseJoint(joint, true);
            }
            storeDeleteJoint(body1Id, body2Id);
        }
        removeLink(chainRef, body1Id, body2Id)
    };

    const updateJoint = (chainRef, jointId, aRef, aOffset, bRef, bOffset) => {
        const [jointRef, body1Id, body2Id] = directGetJoint(jointId);
        const aVisualConfig = aRef.getVisualConfig();
        const bVisualConfig = bRef.getVisualConfig();
        console.log("updateJoint", jointId, body1Id, body2Id, aVisualConfig.uniqueId, bVisualConfig.uniqueId);
        console.log("updateJoint ref", jointId, aRef.current, bRef.current);
        if (jointRef.current) {
            const joint = jointRef.current;
            jointRef.current = undefined;
            if (world.getImpulseJoint(joint.handle)) {
                world.removeImpulseJoint(joint, true);
            }
        }
        const newJointRef = { current: null }; // Create a plain object to hold the reference
        if (aRef.current?.type !== "Group" && bRef.current?.type !== "Group") {
            newJointRef.current = world.createImpulseJoint(
                rapier.JointData.spherical(aOffset, bOffset),
                aRef.current,
                bRef.current,
                true
            );
        } else {
            console.warn("No aRef or bRef for updateJoint", jointId, aRef.current.type, bRef.current.type);
        }
        removeLink(chainRef, body1Id, body2Id);
        addLink(chainRef, aVisualConfig.uniqueId, bVisualConfig.uniqueId);
        directUpdateJoint(jointId, aVisualConfig.uniqueId, bVisualConfig.uniqueId, newJointRef);
    };
    return {deleteJoint, createJoint, updateJoint, addLink};
};

export default useJoints;

// Return the center point of all the joints
const generateJointsData = (positions) => {
    if (positions.length === 1) return [];
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
