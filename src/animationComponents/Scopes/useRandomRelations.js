import { useEffect } from 'react';

function useRandomRelations(config, frameStateRef, entityCount, entityRefsRef, getEntityRefFn, relationsRef, indexArray) {
    useEffect(() => {
        // Generate a random number between 1000 and 10000 which determines the duration of relations
        const randomDuration = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
        const interval = setInterval(() => {
            if (config.showRelations && frameStateRef.current !== "init") {
                const relationCount = Math.ceil(entityCount * 0.2);
                let relationFound = 0;
                const allKeys = Object.keys(relationsRef.current);
                // Randomly delete keys so we remove relations (and create space for new ones)
                allKeys.forEach(key => {
                    if (Math.random() < 0.25) {
                        delete relationsRef.current[key];
                    }
                });
                // Update relationFound after removing relations
                relationFound = Object.keys(relationsRef.current).length;
                while (relationFound < relationCount) {

                    // Randomly select an entity from this CompoundEntity
                    const randomIndexFrom = Math.floor(Math.random() * entityCount);
                    const entityRefFrom = entityRefsRef.current[randomIndexFrom];
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
                                    continue;
                                }
                                break;
                            }
                            const randomIndex = Math.floor(Math.random() * max);
                            randomPath.push(randomIndex);
                        }
                        // getEntityRefFn will walk the CompoundEntity tree to find the entityRef 
                        entityRefTo = getEntityRefFn(randomPath);
                        // Most of the time we want to select an entity inside this CompoundEntity
                    } else {
                        let randomIndexTo = Math.floor(Math.random() * entityCount);
                        entityRefTo = entityRefsRef.current[randomIndexTo];
                    }

                    const userDataTo = entityRefTo.current.getUserData() || {};
                    const toId = userDataTo.uniqueIndex;

                    // Avoid selecting the same entity for from and to 
                    if (fromId === toId) continue;

                    const randomIndexFromRelations = userDataFrom.relations || [];
                    entityRefFrom.current.setUserData({ ...userDataFrom, relations: [...randomIndexFromRelations, entityRefTo] });

                    if (!relationsRef.current[fromId]) relationsRef.current[fromId] = {};
                    relationsRef.current[fromId][toId] = [entityRefFrom, entityRefTo];

                    relationFound++;
                }
            }
        }, randomDuration);
        return () => {
            clearInterval(interval); // Cleanup interval on component unmount
        };
    }, [config.showRelations, frameStateRef, entityCount, entityRefsRef, getEntityRefFn, relationsRef]);
}

export default useRandomRelations;
