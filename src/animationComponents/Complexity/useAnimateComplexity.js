import { useEffect, useState ,useCallback, useRef } from 'react';
import useStoreEntity from './useStoreEntity';

function useAnimateComplexity(config, internalRef) {

    const [storeEntityReady, setStoreEntityReady] = useState(false);
    // Avoid changes in store causing rerender
    // Direct access to the state outside of React's render flow
    const {addNode: directAddNode, updateNode: directUpdateNode, getNode: directGetNode } = useStoreEntity.getState();
    const [started, setStarted] = useState(false);


    function addNodesRecursively(entityCounts, node) {
        const [currentCount, ...restCounts] = entityCounts;      
        for (let i = 0; i < currentCount; i++) {
            const newId = directAddNode(node.id);
            const newNode = directGetNode(newId);
            addNodesRecursively(restCounts, newNode);
        }
    }

    // Initialization logging/debug
    useEffect(() => {
        if (started) return;
        if (!config.entityCounts) return;
        console.log("useAnimateComplexity", config.entityCounts);
        setStarted(true);
        // Blow away the storesremountConfigState
        useStoreEntity.getState().reset();
        const rootNode = directGetNode("root");
        addNodesRecursively([config.entityCounts[0]], rootNode);
        directUpdateNode("root", {ref: internalRef});
        setStoreEntityReady(true);
        console.log("Nodes after initialization", useStoreEntity.getState().getAllNodes());

        const delay = 1000; // Delay in milliseconds (1000ms = 1s)
        setTimeout(() => {
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
