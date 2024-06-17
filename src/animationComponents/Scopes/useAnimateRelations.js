import { useEffect } from 'react';
import useEntityStore from './useEntityStore';
import useRelationStore from './useRelationStore';

function useAnimateRelations(config, frameState, entityCount, node, entityNodes) {

    const { getNode, getPropertyAllKeys, } = useEntityStore(); 
    const { setRelation, getAllRelations, removeRelations } = useRelationStore();

    const entityRefs = entityNodes.map(entity => entity.ref);

    useEffect(() => {
        // Generate a random number between 1000 and 10000 which determines the duration of relations
        const randomDuration = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
        const interval = setInterval(() => {
            if (config.showRelations && frameState !== "init") {
                const maxDepth = getPropertyAllKeys('depth').length;
                console.log("maxDepth", maxDepth)
                const relationCount = Math.ceil(entityCount * 0.2);
                let relationFound = 0;
                const allKeys = Object.keys(getAllRelations);
                // Randomly delete keys so we remove relations (and create space for new ones)
                allKeys.forEach(key => {
                    if (Math.random() < 0.25) {
                        removeRelations(key);
                    }
                });
                // Update relationFound after removing relations
                // We could maintain a count in the Store
                relationFound = Object.keys(getAllRelations).length;
                while (relationFound < relationCount) {

                    // Randomly select an entity from this CompoundEntity
                    const randomIndexFrom = Math.floor(Math.random() * entityCount);
                    const entityRefFrom = entityRefs[randomIndexFrom];
                    const userDataFrom = entityRefFrom.current.getUserData() || {};
                    const fromId = userDataFrom.uniqueIndex;

                    // Randomly select an entity which entityRefFrom will go to
                    let entityRefTo;
                    // Some of the time we want to select an entity outside of this CompoundEntity
                    if (Math.random() < 0.2) {
                        let randomPath = [];
                        // Most of the time we want to select an entity inside this CompoundEntity
                        
                        const maxDistanceUp = node.depth;
                        let destinationNode;
                        let destinationNodeId = node.id;
                        // This is the distance to hop "up" - max of 2
                        let hopUp = 0;
                        let rollOfDice = Math.random();
                        if (rollOfDice < 0.8) {
                            hopUp = 0;
                        } else if (rollOfDice < 0.9 && maxDistanceUp) {
                            destinationNodeId = node.parentId;
                            hopUp = 1;
                        } else if (maxDistanceUp > 1) {
                            const parentNode = getNode(node.parentId);
                            destinationNodeId = parentNode. parentId;
                            hopUp = 2;
                        }
                        destinationNode = getNode(destinationNodeId);
                        const maxDistanceDown = maxDepth - node.depth + hopUp;
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
                            console.log("hopDown", hopDown, "destinationNodeId", destinationNodeId, "randomIndex", randomIndex, "childNode", childNode)
                        }
                        destinationNode = getNode(destinationNodeId);
                        entityRefTo = destinationNode.ref;
                    } else {
                        let randomIndexTo = Math.floor(Math.random() * entityCount);
                        entityRefTo = entityRefs[randomIndexTo];
                    }

                    const userDataTo = entityRefTo.current.getUserData() || {};
                    const toId = userDataTo.uniqueIndex;

                    // Avoid selecting the same entity for from and to 
                    if (fromId === toId) continue;

                    const randomIndexFromRelations = userDataFrom.relations || [];
                    entityRefFrom.current.setUserData({ ...userDataFrom, relations: [...randomIndexFromRelations, entityRefTo] });

                    setRelation(fromId, toId, [entityRefFrom, entityRefTo]);

                    relationFound++;
                }
            }
        }, randomDuration);
        return () => {
            clearInterval(interval); // Cleanup interval on component unmount
        };
    }, [config.showRelations, frameState, entityCount]);
}

export default useAnimateRelations;
