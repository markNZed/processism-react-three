import React, { useEffect, useState } from 'react';
import useEntityStore from './useEntityStore';

const EntityStoreDemo = () => {
  const {
    nodes,
    addNode,
    updateNode,
    moveNode,
    deleteNode,
    getNodesByPropertyAndDepth,
    flattenTree,
    traverseTreeDFS,
    copySubtree,
  } = useEntityStore();

  const [testResults, setTestResults] = useState([]);
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeParentId, setNewNodeParentId] = useState('');
  const [updateNodeId, setUpdateNodeId] = useState('');
  const [updateNodeName, setUpdateNodeName] = useState('');
  const [moveNodeId, setMoveNodeId] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [deleteNodeId, setDeleteNodeId] = useState('');
  const [copyNodeId, setCopyNodeId] = useState('');
  const [copyNewParentId, setCopyNewParentId] = useState('');
  const [property, setProperty] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const results = [];

    try {
      // Test 1: Add nodes
      addNode('root', { id: 'node1', name: 'Node 1' });
      addNode('root', { id: 'node2', name: 'Node 2' });
      addNode('node1', { id: 'node3', name: 'Node 3' });
      results.push('Test 1 Passed: Nodes added successfully.');

      // Wait for the state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test 2: Update node
      updateNode('node3', { name: 'Updated Node 3' });

      // Wait for the state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedNodes = useEntityStore.getState().nodes;
      if (updatedNodes['node3'] && updatedNodes['node3'].name === 'Updated Node 3') {
        results.push('Test 2 Passed: Node updated successfully.');
      } else {
        results.push('Test 2 Failed: Node update failed.');
      }

      // Test 3: Move node
      moveNode('node3', 'node2');

      // Wait for the state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const movedNodes = useEntityStore.getState().nodes;
      if (movedNodes['node2'] && movedNodes['node2'].childrenIds.includes('node3')) {
        results.push('Test 3 Passed: Node moved successfully.');
      } else {
        results.push('Test 3 Failed: Node move failed.');
      }

      // Test 4: Delete node
      deleteNode('node3');

      // Wait for the state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const nodesAfterDelete = useEntityStore.getState().nodes;
      if (!nodesAfterDelete['node3']) {
        results.push('Test 4 Passed: Node deleted successfully.');
      } else {
        results.push('Test 4 Failed: Node delete failed.');
      }

      // Test 5: Copy subtree
      addNode('node1', { id: 'node4', name: 'Node 4' });
      addNode('node4', { id: 'node5', name: 'Node 5' });

      // Wait for the state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      copySubtree('node4', 'node2');

      // Wait for the state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const copiedNodes = useEntityStore.getState().nodes;
      if (copiedNodes['node2'] && copiedNodes['node2'].childrenIds.some(childId => copiedNodes[childId]?.name === 'Node 4')) {
        results.push('Test 5 Passed: Subtree copied successfully.');
      } else {
        console.log("copiedNodes['node2'].childrenIds", copiedNodes['node2'].childrenIds)
        results.push('Test 5 Failed: Subtree copy failed.');
      }

      // Test 6: Find nodes by property and depth
      const foundNodes = getNodesByPropertyAndDepth('name', 'Node 1', 1);
      if (foundNodes.length > 0) {
        results.push('Test 6 Passed: Nodes found by property and depth successfully.');
      } else {
        results.push('Test 6 Failed: Finding nodes by property and depth failed.');
      }

      // Test 7: Flatten tree
      const flatTree = flattenTree();
      if (flatTree.length > 0) {
        results.push('Test 7 Passed: Tree flattened successfully.');
      } else {
        results.push('Test 7 Failed: Tree flattening failed.');
      }

      // Test 8: Traverse tree DFS
      const dfsNodes = [];
      traverseTreeDFS(node => dfsNodes.push(node.id));
      if (dfsNodes.includes('root') && dfsNodes.length > 0) {
        results.push('Test 8 Passed: Tree traversed using DFS successfully.');
      } else {
        results.push('Test 8 Failed: DFS traversal failed.');
      }
    } catch (error) {
      results.push(`Test Failed with error: ${error.message}`);
    }

    setTestResults(results);
    console.log(results);
  };

  const handleAddNode = () => {
    addNode(newNodeParentId, { id: newNodeId, name: `Node ${newNodeId}`, childrenIds: [] });
    setNewNodeId('');
    setNewNodeParentId('');
  };

  const handleUpdateNode = () => {
    updateNode(updateNodeId, { name: updateNodeName });
    setUpdateNodeId('');
    setUpdateNodeName('');
  };

  const handleMoveNode = () => {
    moveNode(moveNodeId, newParentId);
    setMoveNodeId('');
    setNewParentId('');
  };

  const handleDeleteNode = () => {
    deleteNode(deleteNodeId);
    setDeleteNodeId('');
  };

  const handleCopySubtree = () => {
    copySubtree(copyNodeId, copyNewParentId);
    setCopyNodeId('');
    setCopyNewParentId('');
  };

  const displayNodes = () => {
    const flattenedNodes = flattenTree();
    return (
      <ul>
        {flattenedNodes.map(node => (
          <li key={node.id}>
            {node.name} (ID: {node.id})
            {node.childrenIds && Array.isArray(node.childrenIds) && (
              <ul>
                {node.childrenIds.map(childId => (
                  <li key={childId}>{nodes[childId]?.name} (ID: {childId})</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <h1>Tree Operations</h1>

      <h2>Add Node</h2>
      <input
        type="text"
        placeholder="New Node ID"
        value={newNodeId}
        onChange={(e) => setNewNodeId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Parent Node ID"
        value={newNodeParentId}
        onChange={(e) => setNewNodeParentId(e.target.value)}
      />
      <button onClick={handleAddNode}>Add Node</button>

      <h2>Update Node</h2>
      <input
        type="text"
        placeholder="Node ID"
        value={updateNodeId}
        onChange={(e) => setUpdateNodeId(e.target.value)}
      />
      <input
        type="text"
        placeholder="New Name"
        value={updateNodeName}
        onChange={(e) => setUpdateNodeName(e.target.value)}
      />
      <button onClick={handleUpdateNode}>Update Node</button>

      <h2>Move Node</h2>
      <input
        type="text"
        placeholder="Node ID"
        value={moveNodeId}
        onChange={(e) => setMoveNodeId(e.target.value)}
      />
      <input
        type="text"
        placeholder="New Parent ID"
        value={newParentId}
        onChange={(e) => setNewParentId(e.target.value)}
      />
      <button onClick={handleMoveNode}>Move Node</button>

      <h2>Delete Node</h2>
      <input
        type="text"
        placeholder="Node ID"
        value={deleteNodeId}
        onChange={(e) => setDeleteNodeId(e.target.value)}
      />
      <button onClick={handleDeleteNode}>Delete Node</button>

      <h2>Copy Subtree</h2>
      <input
        type="text"
        placeholder="Node ID to Copy"
        value={copyNodeId}
        onChange={(e) => setCopyNodeId(e.target.value)}
      />
      <input
        type="text"
        placeholder="New Parent ID"
        value={copyNewParentId}
        onChange={(e) => setCopyNewParentId(e.target.value)}
      />
      <button onClick={handleCopySubtree}>Copy Subtree</button>

      <h2>Find Nodes by Property and Depth</h2>
      <input
        type="text"
        placeholder="Property"
        value={property}
        onChange={(e) => setProperty(e.target.value)}
      />
      <input
        type="text"
        placeholder="Value"
        value={propertyValue}
        onChange={(e) => setPropertyValue(e.target.value)}
      />
      <input
        type="number"
        placeholder="Depth"
        value={depth}
        onChange={(e) => setDepth(Number(e.target.value))}
      />
      <button
        onClick={() => console.log(getNodesByPropertyAndDepth(property, propertyValue, depth))}
      >
        Find Nodes
      </button>

      <h2>Flatten Tree</h2>
      {displayNodes()}

      <h2>Traverse Tree DFS</h2>
      <button onClick={() => traverseTreeDFS(node => console.log(node))}>
        Traverse Tree
      </button>

      <h2>Test Results</h2>
      <ul>
        {testResults.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ul>
    </div>
  );
};

export default EntityStoreDemo;
