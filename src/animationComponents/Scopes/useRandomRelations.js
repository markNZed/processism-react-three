import { useEffect } from 'react';
import useEntityStore from './useEntityStore';
import useRelationStore from './useRelationStore';

function useRandomRelations(config, frameStateRef, entityCount, indexArray, node, children) {

    const {
        addNode,
        updateNode,
        getNode,
        moveNode,
        deleteNode,
        getNodesByPropertyAndDepth,
        flattenTree,
        traverseTreeDFS,
        copySubtree,
    } = useEntityStore(); 
    const { setRelation, getRelation, getRelations, getAllRelations, addRelation, removeRelation, removeRelations, clearRelation, clearAllRelations } = useRelationStore();

    const getEntityRefByPath = (path) => {
        //console.log("getEntityRefByPath", path);
        let id = "root";
        let entity = getNode(id);
        let entityRef = entity.ref;
        path.slice(0, -1).forEach((i) => {
            entity = getNode(entity.childrenIds[i]);
            entityRef = entity.ref;
        });
        return entityRef;
    };

    const entityRefs = children.map(entity => entity.ref);

    useEffect(() => {
        // Generate a random number between 1000 and 10000 which determines the duration of relations
        const randomDuration = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
        const interval = setInterval(() => {
            if (config.showRelations && frameStateRef.current !== "init") {
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
                        for (let i = 0; i < config.entityCounts.length; i++) {
                            const max = config.entityCounts[i];
                            // Bias to chose entities that are close to this CompoundEntity
                            if (Math.random() < 0.9) {
                                if (indexArray[i]) {
                                    randomPath.push(indexArray[i]);
                                    break;
                                }
                            }
                            const randomIndex = Math.floor(Math.random() * max);
                            randomPath.push(randomIndex);
                        }
                        entityRefTo = getEntityRefByPath(randomPath);
                        // Most of the time we want to select an entity inside this CompoundEntity
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
    }, [config.showRelations, frameStateRef, entityCount, getEntityRefByPath]);
}

export default useRandomRelations;
