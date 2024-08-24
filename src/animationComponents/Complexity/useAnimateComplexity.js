import { useEffect, useState, useRef } from 'react';

function useAnimateComplexity(config, ref) {

    const [storeEntityReady, setStoreEntityReady] = useState(false);
    // Avoid changes in store causing rerender
    // Direct access to the state outside of React's render flow
    const {addNode: directAddNode, updateNode: directUpdateNode, getNode: directGetNode } = config.entityStore.getState();
    const startedRef = useRef(false);

    function addNodesRecursively(entityCounts, node) {
        const nodeCount = (Array.isArray(entityCounts)) ? entityCounts.length : entityCounts;
        for (let i = 0; i < nodeCount; i++) {
            const newId = directAddNode(node.id);
            const newNode = directGetNode(newId);
            if (Array.isArray(entityCounts)) {
                addNodesRecursively(entityCounts[i], newNode);
            }
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
        config.entityStore.getState().reset();
        const rootNode = directGetNode("root");
        // We have 2 nodes at top that should have a joint - but the joint is not between two particles at this level
        addNodesRecursively(config.entityCounts, rootNode);
        directUpdateNode("root", { ref: ref });
        setStoreEntityReady(true);
        console.log("Nodes after initialization", config.entityStore.getState());    
    }, [config]);

    return {storeEntityReady}
}

export default useAnimateComplexity;
