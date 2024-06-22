import { useEffect, useCallback, useRef } from 'react';
import useStoreEntity from './useStoreEntity';

function useAnimateRelations(initialized, node, entityNodes, config) {

    const { getNode, getPropertyAllKeys, deleteRelation, addRelation, getRelationCount } = useStoreEntity.getState();
    const entityCount = node.childrenIds.length;
    const maxDepth = getPropertyAllKeys('depth').length;
    const intervalRef = useRef(null); // Ref to store interval ID

    const handleRelations = useCallback(() => {
        const currentTotalRelations = getRelationCount();
        if (currentTotalRelations > config.maxRelations) return;

        node.childrenIds.forEach((fromId, i) => {
            const fromNode = entityNodes[i];
            if (fromNode.isParticle && Math.random() < 0.99) return;

            const maxRelationCount = Math.ceil(entityCount * 0.2);
            const nodeRelations = fromNode.relationsRef.current;
            let relationCount = nodeRelations.length || 0;

            // Randomly delete relations
            nodeRelations.forEach(toId => {
                if (Math.random() < 0.25) {
                    deleteRelation(fromId, toId);
                }
            });

            relationCount = fromNode.relationsRef.current.length;

            while (relationCount < maxRelationCount) {
                let toId;
                let entityRefTo;
                if (Math.random() < 0.2) {
                    const maxDistanceUp = fromNode.depth;
                    let destinationNodeId = fromId;
                    let hopUp = 0;
                    let rollOfDice = Math.random();
                    if (rollOfDice < 0.8) {
                        hopUp = 0;
                    } else if (rollOfDice < 0.9 && maxDistanceUp) {
                        destinationNodeId = fromNode.parentId;
                        hopUp = 1;
                    } else if (maxDistanceUp > 1) {
                        const parentNode = getNode(fromNode.parentId);
                        destinationNodeId = parentNode.parentId;
                        hopUp = 2;
                    }
                    const destinationNode = getNode(destinationNodeId);
                    // add 1 to depth because it starts at 0
                    const maxDistanceDown = maxDepth - (destinationNode.depth + 1);
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
                    const finalDestinationNode = getNode(destinationNodeId);
                    entityRefTo = finalDestinationNode.ref;
                    toId = destinationNodeId;
                } else {
                    // Preference is a relation with a sibling
                    let randomIndexTo = Math.floor(Math.random() * node.childrenIds.length);
                    toId = node.childrenIds[randomIndexTo];
                    entityRefTo = entityNodes[randomIndexTo];
                }

                // Avoid selecting the same entity for from and to
                if (fromId === toId) continue;

                addRelation(fromId, toId);
                relationCount++;
            }
        });
    }, [entityNodes, node.childrenIds, entityCount, maxDepth, config.maxRelations]);

    useEffect(() => {
        if (!config.showRelations || !initialized) return;

        const startInterval = () => {
            // Generate a random number between 500 and 5000 which determines the duration of relations
            const minDuration = 500;
            const maxDuration = 5000;
            const randomDuration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;

            intervalRef.current = setInterval(() => {
                handleRelations();
                clearInterval(intervalRef.current);
                startInterval(); // Restart the interval after it expires
            }, randomDuration);
        };

        startInterval();

        return () => {
            clearInterval(intervalRef.current); // Cleanup interval on component unmount
        };
    }, [config.showRelations, initialized]);

    return null;
}

export default useAnimateRelations;
