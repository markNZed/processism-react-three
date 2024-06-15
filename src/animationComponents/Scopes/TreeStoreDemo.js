import React, { useState } from 'react';
import useTreeStore from './useTreeStore';

const TreeStoreDemo = () => {
  const {
    nodes,
    addNode,
    updateNode,
    moveNode,
    deleteNode,
    getNode,
    findNodesByProperty,
    flattenTree,
    traverseTreeDFS,
    copySubtree,
  } = useTreeStore();
  
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeParentId, setNewNodeParentId] = useState('');
  const [updateNodeId, setUpdateNodeId] = useState('');
  const [updateNodeName, setUpdateNodeName] = useState('');
  const [moveNodeId, setMoveNodeId] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [deleteNodeId, setDeleteNodeId] = useState('');
  const [copyNodeId, setCopyNodeId] = useState('');
  const [copyNewParentId, setCopyNewParentId] = useState('');
  
  const handleAddNode = () => {
    addNode(newNodeParentId, { id: newNodeId, name: `Node ${newNodeId}`, children: [] });
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
            <ul>
              {node.children.map(childId => (
                <li key={childId}>{nodes[childId].name} (ID: {childId})</li>
              ))}
            </ul>
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

      <h2>Flatten Tree</h2>
      {displayNodes()}

      <h2>Traverse Tree DFS</h2>
      <button onClick={() => traverseTreeDFS(node => console.log(node))}>
        Traverse Tree
      </button>

      <h2>Find Nodes by Property</h2>
      <button
        onClick={() =>
          console.log(findNodesByProperty('name', 'Node 1'))
        }
      >
        Find Nodes with Name 'Node 1'
      </button>
    </div>
  );
};

export default TreeStoreDemo;
