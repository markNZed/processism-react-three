import { useEffect, useState, useRef } from 'react';

function useAnimateComplexity(config, ref, entityStore) {

    const [storeEntityReady, setStoreEntityReady] = useState(false);
    // Avoid changes in store causing rerender
    // Direct access to the state outside of React's render flow
    const {addNode: directAddNode, updateNode: directUpdateNode, getNode: directGetNode } = entityStore.getState();
    const startedRef = useRef(false);

    function addNodesRecursively(entityCounts, node) {
        const [currentCount, ...restCounts] = entityCounts;      
        for (let i = 0; i < currentCount; i++) {
            const newId = directAddNode(node.id);
            const newNode = directGetNode(newId);
            addNodesRecursively(restCounts, newNode);
        }
    }

    /*
      How do we grow the joints. Slowly add particles.
      1st particle in the center
    */
    useEffect(() => {
        console.log("useAnimateComplexity", config, startedRef.current);
        if (startedRef.current) return;
        if (!config.entityCounts) return;
        startedRef.current = true;
    
        // Blow away the storesremountConfigState
        entityStore.getState().reset();
        const rootNode = directGetNode("root");
        // We have 2 nodes at top that should have a joint - but the joint is not between two particles at this level
        addNodesRecursively(config.entityCounts, rootNode);
        directUpdateNode("root", { ref: ref });
        setStoreEntityReady(true);
        console.log("Nodes after initialization", entityStore.getState());    
    }, [config]);

    return {storeEntityReady}
}

export default useAnimateComplexity;
