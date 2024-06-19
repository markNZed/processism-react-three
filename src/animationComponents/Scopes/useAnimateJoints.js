import { useEffect } from 'react';
import * as THREE from 'three';
import useStoreEntity from './useStoreEntity';
import useStoreJoint from './useStoreJoint';
import * as utilsJoints from './utilsJoints.js';
import { useRapier } from '@react-three/rapier';

// Remember custom hook can generate renders in the Component so be careful with Zustand stores

const useAnimateJoints = (
    initialized,
    node,
    entityNodes,
    config,
) => {

    const { world, rapier } = useRapier();
    // Direct access to the state outside of React's render flow
    const getNodeProperty = useStoreEntity.getState().getNodeProperty;
    const particleRadiusRef = getNodeProperty('root', 'particleRadiusRef');
    const getJoint = useStoreJoint.getState().getJoint;
    const id = node.id;
    const internalRef = node.ref;
    const entityRefs = entityNodes.map(entity => entity.ref);

    // Experimenting on how to migrate an entity
    // Start with single particle
    // Need to remove the entity from CompoundEntity center calculations - where does it belong?
    // Could maintain a list of "detached" particles at the CompoundEntity level (can filter for center calc)
    // Adding an entity to a CompoundEntity will also be a challenge e.g. array sizes change
    //   What needs to change ? 
    //     entityCount, entitiesParticlesRefsRef, particleRefs, entityPositions, jointsData, 
    //     entitiesRegisteredRef, particlesRegisteredRef, newJoints
    // Could have a "move" entity command that is similar to getEntityRefFn so from anywhere we can call
    // moveEntityFn and it would find the entity and detach it then find the destination and attach it

    useEffect(() => {
        if (!initialized || !config.detach) return
        // Generate a random number between 1000 and 10000 which determines the duration of relations
        const randomDuration = 1000; //Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
        const interval = setInterval(() => {
            // With "Scope-3" this is at scope 1 so userData.uniqueId is e.g. "Scope-3-5" not a Particle index
            if (initialized && id == "Scope-8-3") {
                // Randomly select an entity from this CompoundEntity
                const randomIndexFrom = 1; //Math.floor(Math.random() * entityCount);
                const entityRef = entityRefs(randomIndexFrom);
                const userData = entityRef.current.getUserData();
                const entityUniqueId = userData.uniqueId;
                const jointsRef = getNodeProperty(entityUniqueId, `jointsRef`);
                const entityJointIndexes = jointsRef.current;
                let replacementEntity;
                let closestId;
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
                    function replaceEntity(body, entityUniqueId) {
                        if (body.userData.uniqueId === entityUniqueId) return false;
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
                    if (replaceEntity(body1, entityUniqueId)) {
                        replacementEntity = body1;
                        closestId = body1.userData.uniqueId;
                    }
                    if (replaceEntity(body2, entityUniqueId)) {
                        replacementEntity = body2;
                        closestId = body2.userData.uniqueId;
                    }
                    //console.log("Joint anchors", jointKey, a1, body1, a2, body2);
                });
                console.log("Detach a random entity", id, entityUniqueId, entityRef, "closestId", closestId, "replacementEntity", replacementEntity);
                const jointsToCreate = [];
                entityJointIndexes.forEach((jointKey) => {
                    const jointRef = getJoint(jointKey);
                    let body1 = jointRef.current.body1();
                    let body2 = jointRef.current.body2();
                    if (replacementEntity.userData.uniqueId == body1.userData.uniqueId) return;
                    if (replacementEntity.userData.uniqueId == body2.userData.uniqueId) return;
                    if (body1.userData.uniqueId === entityUniqueId) {
                        body1 = replacementEntity;
                    }
                    if (body2.userData.uniqueId === entityUniqueId) {
                        body2 = replacementEntity;
                    }
                    // Can't just copy the offset, need to recalculate them. Create a function for this ?
                    // The radius of the replacement may not be the same...
                    const { offset1, offset2 } = calculateJointOffsets(body1, body2, particleRadiusRef);
                    // Offset needs to be in local coordinates - should be OK for 
                    const a = {
                        ref: {current: body1},
                        offset: offset1,
                    }
                    const b = {
                        ref: {current: body2},
                        offset: offset2,
                    }
                    jointsToCreate.push([a, b]);
                });
                const scope = getNodeProperty(closestId, 'depth');
                entityJointIndexes.forEach((jointKey) => {
                    utilsJoints.deleteJoint(world, jointKey, scope);
                    console.log("deleteJoint", jointKey);
                });
                jointsToCreate.forEach(([a, b]) => {
                    a.ref.current.userData.color = 'orange';
                    b.ref.current.userData.color = 'orange';
                    utilsJoints.createJoint(world, rapier, a, b, scope);
                })
            }
            clearInterval(interval);
        }, randomDuration);
        return () => {
            clearInterval(interval); // Cleanup interval on component unmount
        }
    }, [initialized, config]);

};

export default useAnimateJoints;