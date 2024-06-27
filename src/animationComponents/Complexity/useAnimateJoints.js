import { useEffect } from 'react';
import * as THREE from 'three';
import useStoreEntity from './useStoreEntity';
import { useRapier } from '@react-three/rapier';
import * as utils from './utils';

// Remember custom hook can generate renders in the Component so be careful with Zustand stores

const useAnimateJoints = (
    initialized,
    node,
    entityNodes,
    deleteJoint, 
    createJoint,
    config,
) => {

    const { world, rapier } = useRapier();
    // Direct access to the state outside of React's render flow
    const { getNodeProperty, getJoint } = useStoreEntity.getState();
    const particleRadius = getNodeProperty('root', 'particleRadius');
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
            // With "Scope-3" this is at scope 1 so visualConfig.uniqueId is e.g. "Scope-3-5" not a Particle index
            if (initialized && id == "Scope-8-3") {
                // Randomly select an entity from this CompoundEntity
                const randomIndexFrom = 1; //Math.floor(Math.random() * entityCount);
                const entityRef = entityRefs(randomIndexFrom);
                const visualConfig = entityRef.current.getVisualConfig();
                const entityUniqueId = visualConfig.uniqueId;
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
                entityJointIndexes.forEach((jointId) => {
                    const [jointRef, body1Id, body2Id] = getJoint(jointId);
                    const body1 = jointRef.current.body1();
                    const body2 = jointRef.current.body2();
                    // Entity needs to store parent entity in visualConfig ?
                    // Find the entity which is closest to the center of this CompoundEntity
                    function replaceEntity(body, entityUniqueId) {
                        if (body.visualConfig.uniqueId === entityUniqueId) return false;
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
                        closestId = body1.visualConfig.uniqueId;
                    }
                    if (replaceEntity(body2, entityUniqueId)) {
                        replacementEntity = body2;
                        closestId = body2.visualConfig.uniqueId;
                    }
                    //console.log("Joint anchors", jointId, a1, body1, a2, body2);
                });
                console.log("Detach a random entity", id, entityUniqueId, entityRef, "closestId", closestId, "replacementEntity", replacementEntity);
                const jointsToCreate = [];
                entityJointIndexes.forEach((jointId) => {
                    const [jointRef, body1Id, body2Id] = getJoint(jointId);
                    let body1 = jointRef.current.body1();
                    let body2 = jointRef.current.body2();
                    if (replacementEntity.visualConfig.uniqueId == body1.visualConfig.uniqueId) return;
                    if (replacementEntity.visualConfig.uniqueId == body2.visualConfig.uniqueId) return;
                    if (body1.visualConfig.uniqueId === entityUniqueId) {
                        body1 = replacementEntity;
                    }
                    if (body2.visualConfig.uniqueId === entityUniqueId) {
                        body2 = replacementEntity;
                    }
                    // Can't just copy the offset, need to recalculate them. Create a function for this ?
                    // The radius of the replacement may not be the same...
                    const { offset1, offset2 } = utils.calculateJointOffsets(body1, body2, particleRadius);
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
                entityJointIndexes.forEach((jointId) => {
                    deleteJoint(jointId);
                    console.log("deleteJoint", jointId);
                });
                jointsToCreate.forEach(([a, b]) => {
                    a.ref.current.getVisualConfig().color = 'orange';
                    b.ref.current.getVisualConfig().color = 'orange';
                    createJoint(a, b);
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