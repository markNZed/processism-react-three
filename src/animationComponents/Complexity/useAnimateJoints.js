import { useEffect } from 'react';
import * as THREE from 'three';
import * as utils from './utils';

// Remember custom hook can generate renders in the Component so be careful with Zustand stores

const useAnimateJoints = (
    initialized,
    node,
    entityNodes,
    deleteJoint, 
    createJoint,
    worldCenterRef,
    config,
    entityStore
) => {

    // Direct access to the state outside of React's render flow
    const { getNodeProperty, getJoint, getNode } = entityStore.getState();
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
            if (initialized && id == "2") {
                // Randomly select an entity from this CompoundEntity
                const randomIndexFrom = 12; //Math.floor(Math.random() * entityCount);
                const entityRef = entityRefs[randomIndexFrom];
                const visualConfig = entityRef.current.getVisualConfig();
                const entityUniqueId = visualConfig.uniqueId;
                const jointsRef = getNodeProperty(entityUniqueId, `jointsRef`);
                const entityJointIndexes = jointsRef.current;
                let replacementBody;
                let replacementId;
                let closestDistance = Infinity;
                // Create a new Vector3 to store the world position of this CompoundEntity
                const worldPosition = new THREE.Vector3();
                internalRef.current.getWorldPosition(worldPosition);
                // Vector3 to be used for particle world position
                const particleWorldPosition = new THREE.Vector3();
                // Find the entity that will replace the entityUniqueId (that will be deleted)
                entityJointIndexes.forEach((jointId) => {
                    const {jointRef, body1Id, body2Id} = getJoint(jointId);
                    const body1 = jointRef.current.body1();
                    const body2 = jointRef.current.body2();
                    // Entity needs to store parent entity in visualConfig ?
                    // Find the entity which is closest to the center of this CompoundEntity
                    function replaceEntity(body, bodyId, entityUniqueId) {
                        if (bodyId === entityUniqueId) return false;
                        const pos = body.translation();
                        particleWorldPosition.set(pos.x, pos.y, pos.z);
                        const distance = particleWorldPosition.distanceTo(worldCenterRef.current);
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            return true
                        } else {
                            return false;
                        }
                    }
                    if (replaceEntity(body1, body1Id, entityUniqueId)) {
                        replacementBody = body1;
                        replacementId = body1Id;
                    }
                    if (replaceEntity(body2, body2Id, entityUniqueId)) {
                        replacementBody = body2;
                        replacementId = body2Id;
                    }
                    //console.log("Joint anchors", jointId, a1, body1, a2, body2);
                });
                console.log("Detach a random entity", id, entityUniqueId, entityRef, "replace with", replacementId);
                const replacementNodeRef = getNode(entityUniqueId).ref;
                const replacementVisualConfig = replacementNodeRef.current.getVisualConfig();
                replacementVisualConfig.color = 'purple';
                replacementNodeRef.current.setVisualConfig(replacementVisualConfig);
                const jointsToCreate = [];
                entityJointIndexes.forEach((jointId) => {
                    let {jointRef, body1Id, body2Id} = getJoint(jointId);
                    let body1 = jointRef.current.body1();
                    let body2 = jointRef.current.body2();
                    if (replacementId == body1Id || replacementId == body2Id) return;
                    if (body1Id === entityUniqueId) {
                        body1 = replacementBody;
                        body1Id = replacementId;
                    }
                    if (body2Id === entityUniqueId) {
                        body2 = replacementBody;
                        body2Id = replacementId;
                    }
                    // Can't just copy the offset, need to recalculate them. Create a function for this ?
                    // The radius of the replacement may not be the same...
                    const node1Ref = getNode(body1Id).ref;
                    const node2Ref = getNode(body2Id).ref;
                    const visualConfig1 = node1Ref.current.getVisualConfig();
                    const visualConfig2 = node2Ref.current.getVisualConfig();
                    const radius1 = visualConfig1.colliderRadius;
                    const radius2 = visualConfig2.colliderRadius;
                    const { offset1, offset2 } = utils.calculateJointOffsets(body1, body2, radius1, radius2);
                    // Offset needs to be in local coordinates - should be OK for 
                    jointsToCreate.push([node1Ref, offset1, node2Ref, offset2]);
                    visualConfig1.color = 'orange';
                    node1Ref.current.setVisualConfig(visualConfig1);
                    visualConfig2.color = 'orange';
                    node2Ref.current.setVisualConfig(visualConfig2);
                });
                entityJointIndexes.forEach((jointId) => {
                    deleteJoint(node.chainRef, jointId);
                    console.log("deleteJoint", jointId);
                });
                jointsToCreate.forEach(([body1Ref, offset1, body2Ref, offset2]) => {
                    createJoint(node.chainRef, body1Ref.current, offset1, body2Ref.current, offset2);
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