import { useEffect } from 'react';
import useStoreEntity from './useStoreEntity';
import useStoreRelation from './useStoreRelation';

function useAnimateRelations(initialized, node, entityNodes, config) {

    const getNode = useStoreEntity.getState().getNode;
    const getPropertyAllKeys = useStoreEntity.getState().getPropertyAllKeys;
    const setRelation = useStoreRelation.getState().setRelation;
    const removeRelations = useStoreRelation.getState().removeRelations;
    const entityCount = node.childrenIds.length;
    const maxDepth = getPropertyAllKeys('depth').length;

    useEffect(() => {
        if (!config.showRelations || !initialized) return;
        // Generate a random number between 500 and 5000 which determines the duration of relations
        const minDuration = 500;
        const maxDuration = 5000
        const randomDuration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
        const interval = setInterval(() => {
            node.childrenIds.forEach((fromId, i) => {
                const fromNode = entityNodes[i];
                if (fromNode.isParticle) {
                    // Only a small fraction of Particles have relations
                    if (Math.random() < 0.99) {
                        return;
                    }
                }
                //console.log("maxDepth", maxDepth)
                const maxRelationCount = Math.ceil(entityCount * 0.2);
                // We do this outside of the React render cycle 
                const relationsStore = useStoreRelation.getState();
                let relationCount = fromNode.relationsRef.current.length || 0;
                const nodeRelations = relationsStore.getRelation(fromId);
                const allKeys = Object.keys(nodeRelations);
                // Randomly delete keys so we remove relations (and create space for new ones)
                // Track removed keys for updating the ref
                let removedKeys = [];
                allKeys.forEach(key => {
                    if (Math.random() < 0.25) {
                        removeRelations(key);
                        removedKeys.push(key);
                    }
                });
                fromNode.relationsRef.current = fromNode.relationsRef.current.filter(toId => !removedKeys.includes(toId));
                relationCount = fromNode.relationsRef.current.length;
                while (relationCount < maxRelationCount) {

                    let toId;

                    // Randomly select an entity which entityRefFrom will go to
                    let entityRefTo;
                    // Some of the time we want to select an entity outside of this CompoundEntity
                    if (Math.random() < 0.2) {
                        // Most of the time we want to select an entity inside this CompoundEntity
                        
                        const maxDistanceUp = fromNode.depth;
                        let destinationNode;
                        let destinationNodeId = fromId;
                        // This is the distance to hop "up" - max of 2
                        let hopUp = 0;
                        let rollOfDice = Math.random();
                        if (rollOfDice < 0.8) {
                            hopUp = 0;
                        } else if (rollOfDice < 0.9 && maxDistanceUp) {
                            destinationNodeId = fromNode.parentId;
                            hopUp = 1;
                        } else if (maxDistanceUp > 1) {
                            const parentNode = getNode(fromNode.parentId);
                            destinationNodeId = parentNode. parentId;
                            hopUp = 2;
                        }
                        destinationNode = getNode(destinationNodeId);
                        const maxDistanceDown = maxDepth - fromNode.depth + hopUp;
                        // This is the distance to hop "down" - max of 2
                        let hopDown = 0;
                        rollOfDice = Math.random();
                        if (rollOfDice < 0.8) {
                            hopDown = 0;
                        } else if (rollOfDice < 0.9 && maxDistanceDown) {
                            const randomIndex = Math.floor(Math.random() * destinationNode.childrenIds.length);
                            destinationNodeId = destinationNode.childrenIds[randomIndex];
                            hopDown = 1;
                        } else if (maxDistanceDown > 1) {
                            let randomIndex = Math.floor(Math.random() * destinationNode.childrenIds.length);
                            const childNode = getNode(destinationNode.childrenIds[randomIndex]);
                            if (childNode.childrenIds) {
                                randomIndex = Math.floor(Math.random() * childNode.childrenIds.length);
                                destinationNodeId = childNode.childrenIds[randomIndex];
                            } else {
                                destinationNodeId = childNode.id;
                            }
                            hopDown = 2;
                        }
                        destinationNode = getNode(destinationNodeId);
                        entityRefTo = destinationNode.ref;
                        toId = destinationNodeId;
                    } else {
                        // Preference is a relation with a sibling
                        let randomIndexTo = Math.floor(Math.random() * node.childrenIds.length);
                        toId = node.childrenIds[randomIndexTo];
                        entityRefTo = entityNodes[randomIndexTo]
                    }

                    // Avoid selecting the same entity for from and to 
                    if (fromId === toId) continue;

                    setRelation(fromId, toId, [fromNode.ref, entityRefTo]);
                    fromNode.relationsRef.current.push(toId);

                    relationCount++;

                }
            });
        }, randomDuration);
        return () => {
            clearInterval(interval); // Cleanup interval on component unmount
        };
    }, [config.showRelations, initialized, entityCount]);
}

export default useAnimateRelations;
