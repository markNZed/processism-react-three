import { useEffect, useState ,useCallback, useRef } from 'react';
import useStoreEntity from './useStoreEntity';

function useAnimateComplexity(config, internalRef) {

    const [storeEntityReady, setStoreEntityReady] = useState(false);
    // Avoid changes in store causing rerender
    // Direct access to the state outside of React's render flow
    const {addNode: directAddNode, updateNode: directUpdateNode, getNode: directGetNode } = useStoreEntity.getState();
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
        useStoreEntity.getState().reset();
        const rootNode = directGetNode("root");
        // We have 2 nodes at top that should have a joint - but the joint is not between two particles at this level

        addNodesRecursively([3,9], rootNode);
        //addNodesRecursively([config.entityCounts[0]], rootNode);
        //addNodesRecursively(config.entityCounts, rootNode);
        directUpdateNode("root", { ref: internalRef });
        setStoreEntityReady(true);
        console.log("Nodes after initialization", useStoreEntity.getState().getAllNodes());

        return
    
        const delay = 1000; // Delay in milliseconds (1000ms = 1s)
        const timeoutId = setTimeout(() => {
            // Add more nodes here
            const rootNode = directGetNode("root");
            const depth1Node = directGetNode(rootNode.childrenIds[0]);
            addNodesRecursively([config.entityCounts[1]], depth1Node); // Example of adding more nodes
            console.log("Nodes after adding more nodes", useStoreEntity.getState().getAllNodes());
        }, delay);
    
    }, [config]);
    

    return {storeEntityReady}
}

export default useAnimateComplexity;
