import create from 'zustand';

/**
 * Zustand Tree Store
 * 
 * This module defines a Zustand store for managing a hierarchical tree structure. Each node in the tree can have dynamic properties and child nodes.
 * 
 * ### Key Functionalities:
 * - **Node Creation**: Create new nodes with dynamic properties and specify their parent nodes.
 * - **Node Manipulation**: Add, update, move, and delete nodes within the tree.
 * - **Property Lookups**: Maintain and update lookups for node properties to facilitate quick property-based queries.
 * - **Tree Traversal**: Traverse the tree using depth-first search (DFS) and flatten the tree structure into an array.
 * - **Subtree Operations**: Copy entire subtrees to new parent nodes.
 * 
 * ### Basic Usage:
 * ```javascript
 * import useTreeStore from './path-to-store';
 * 
 * // Access the store
 * const store = useTreeStore();
 * 
 * // Add a new node
 * store.addNode('root', { id: 'node1', name: 'Node 1' });
 * 
 * // Update a node's properties
 * store.updateNode('node1', { name: 'Updated Node 1' });
 * 
 * // Delete a node
 * store.deleteNode('node1');
 * 
 * // Move a node to a new parent
 * store.moveNode('node1', 'newParentId');
 * 
 * // Get nodes by property and depth
 * const nodes = store.getNodesByPropertyAndDepth('name', 'Node 1', 1);
 * 
 * // Flatten the tree into an array
 * const flatTree = store.flattenTree();
 * 
 * // Traverse the tree using DFS
 * store.traverseTreeDFS(node => console.log(node));
 * 
 * // Copy a subtree to a new parent node
 * store.copySubtree('nodeId', 'newParentId');
 * ```
 * 
 * This module provides a flexible and efficient way to manage hierarchical data structures with dynamic properties, making it suitable for various applications such as file systems, organizational charts, and more.
 */

// Function to create a new node with given properties and children.
const createNode = (id, properties = {}, children = []) => ({
    id,
    ...properties,
    children,
  });
  
  // Helper function to remove a node from its parent's children array.
  const removeNodeFromParent = (nodes, nodeId) => {
    for (let key in nodes) {
      const node = nodes[key];
      if (node.children.includes(nodeId)) {
        node.children = node.children.filter(childId => childId !== nodeId);
        break;
      }
    }
  };
  
  // Utility function to update property lookups when adding or updating nodes.
  const updatePropertyLookups = (node, propertyLookups) => {
    const updatedLookups = { ...propertyLookups };
    Object.keys(node).forEach(prop => {
      if (prop !== 'id' && prop !== 'children' && prop !== 'depth') {
        const values = Array.isArray(node[prop]) ? node[prop] : [node[prop]];
        values.forEach(value => {
          if (!updatedLookups[prop]) {
            updatedLookups[prop] = {};
          }
          if (!updatedLookups[prop][value]) {
            updatedLookups[prop][value] = [];
          }
          updatedLookups[prop][value].push(node.id);
        });
      }
    });
    return updatedLookups;
  };

const useTreeStore = create((set, get) => ({
    // Initial state with a root node.
    nodes: {
      root: createNode('root', {}, []),
    },
    // Object to maintain lookups for node properties.
    propertyLookups: {},
  
    // Function to add a new node to the tree.
    addNode: (parentId, node) => set(state => {
      if (state.nodes[node.id]) throw new Error(`Node ID ${node.id} already exists`);
      const parentNode = state.nodes[parentId];
      if (!parentNode) throw new Error(`Parent node ${parentId} does not exist`);
  
      const nodeDepth = (parentNode.depth || 0) + 1;
      const newNode = { ...node, depth: nodeDepth, children: node.children || [] };
  
      return {
        nodes: {
          ...state.nodes,
          [newNode.id]: newNode,
          [parentId]: {
            ...parentNode,
            children: [...(parentNode.children || []), newNode.id],
          },
        },
        propertyLookups: updatePropertyLookups(newNode, state.propertyLookups),
      };
    }),
  
    // Function to update an existing node's properties.
    updateNode: (id, updates) => set(state => {
      const node = state.nodes[id];
      if (!node) throw new Error(`Node ${id} does not exist`);
  
      // Update property lookups before applying changes
      const updatedLookups = { ...state.propertyLookups };
      Object.keys(updates).forEach(prop => {
        if (prop !== 'id' && prop !== 'children' && prop !== 'depth') {
          const oldValues = Array.isArray(node[prop]) ? node[prop] : [node[prop]];
          const newValues = Array.isArray(updates[prop]) ? updates[prop] : [updates[prop]];
  
          oldValues.forEach(value => {
            if (updatedLookups[prop]) {
              updatedLookups[prop][value] = updatedLookups[prop][value].filter(
                nodeId => nodeId !== id
              );
              if (updatedLookups[prop][value].length === 0) {
                delete updatedLookups[prop][value];
              }
            }
          });
  
          newValues.forEach(value => {
            if (!updatedLookups[prop]) {
              updatedLookups[prop] = {};
            }
            if (!updatedLookups[prop][value]) {
              updatedLookups[prop][value] = [];
            }
            updatedLookups[prop][value].push(id);
          });
        }
      });
  
      const newDepth = updates.parentId ? (state.nodes[updates.parentId].depth || 0) + 1 : node.depth;
  
      return {
        nodes: {
          ...state.nodes,
          [id]: {
            ...node,
            ...updates,
            depth: newDepth,
          },
        },
        propertyLookups: updatedLookups,
      };
    }),
  
    // Function to delete a node from the tree.
    deleteNode: (id) => set(state => {
      const nodes = { ...state.nodes };
      const propertyLookups = { ...state.propertyLookups };
  
      const deleteRecursively = (nodeId) => {
        const node = nodes[nodeId];
        if (node) {
          // Remove node from property lookups
          Object.keys(node).forEach(prop => {
            if (prop !== 'id' && prop !== 'children' && prop !== 'depth' && propertyLookups[prop]) {
              const values = Array.isArray(node[prop]) ? node[prop] : [node[prop]];
              values.forEach(value => {
                propertyLookups[prop][value] = propertyLookups[prop][value].filter(
                  nId => nId !== nodeId
                );
                if (propertyLookups[prop][value].length === 0) {
                  delete propertyLookups[prop][value];
                }
              });
            }
          });
  
          // Recursively delete child nodes
          node.children.forEach(childId => deleteRecursively(childId));
          delete nodes[nodeId];
        }
      };
  
      deleteRecursively(id);
      removeNodeFromParent(nodes, id);
  
      return { nodes, propertyLookups };
    }),
  
// Function to move a node to a new parent in the tree.
moveNode: (nodeId, newParentId) => set(state => {
    const nodes = { ...state.nodes };
    const nodeToMove = nodes[nodeId];
    if (!nodeToMove) throw new Error(`Node ${nodeId} does not exist`);
    const newParentNode = nodes[newParentId];
    if (!newParentNode) throw new Error(`New parent node ${newParentId} does not exist`);
  
    removeNodeFromParent(nodes, nodeId);
    const newDepth = (newParentNode.depth || 0) + 1;
  
    const updateDepthRecursively = (nId, depth) => {
      nodes[nId].depth = depth;
      nodes[nId].children.forEach(childId => updateDepthRecursively(childId, depth + 1));
    };
  
    updateDepthRecursively(nodeId, newDepth);
  
    return {
      nodes: {
        ...nodes,
        [newParentId]: {
          ...newParentNode,
          children: [...(newParentNode.children || []), nodeId],
        },
      },
    };
  }),
  
  
    // Function to retrieve nodes by a specific property and depth.
    getNodesByPropertyAndDepth: (property, value, depth) => {
      const nodes = get().nodes;
      const nodeIds = get().propertyLookups[property]?.[value] || [];
      return nodeIds.filter(nodeId => nodes[nodeId].depth === depth);
    },
  
    // Function to flatten the tree into an array.
    flattenTree: () => {
      const nodes = get().nodes;
      const result = [];
      const stack = [nodes['root']];
      while (stack.length) {
        const node = stack.pop();
        result.push(node);
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(childId => {
            const childNode = nodes[childId];
            if (childNode) {
              stack.push(childNode);
            }
          });
        }
      }
      return result;
    },
  
    // Function to traverse the tree using Depth-First Search (DFS).
    traverseTreeDFS: (callback) => {
      const nodes = get().nodes;
      const traverse = (node) => {
        callback(node);
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(childId => traverse(nodes[childId]));
        }
      };
      traverse(nodes['root']);
    },
  
// Function to copy a subtree to a new parent node.
copySubtree: (nodeId, newParentId) => set(state => {
    const nodes = { ...state.nodes };
    if (!nodes[nodeId]) throw new Error(`Node ${nodeId} does not exist`);
    if (!nodes[newParentId]) throw new Error(`New parent node ${newParentId} does not exist`);
  
    const generateUniqueId = (baseId) => {
      let newId = `${baseId}_copy`;
      let counter = 1;
      while (nodes[newId]) {
        newId = `${baseId}_copy_${counter}`;
        counter++;
      }
      return newId;
    };
  
    const copyRecursively = (node, parentDepth) => {
      const newNodeId = generateUniqueId(node.id);
      const newDepth = parentDepth + 1;
      const newNode = {
        ...JSON.parse(JSON.stringify(node)), // Ensuring a deep copy of the node properties
        id: newNodeId,
        depth: newDepth,
        children: [],
      };
      newNode.children = node.children.map(childId => {
        const copiedChild = copyRecursively(nodes[childId], newDepth);
        return copiedChild.id;
      });
      nodes[newNode.id] = newNode;
      return newNode;
    };
  
    const nodeToCopy = nodes[nodeId];
    const newSubtree = copyRecursively(nodeToCopy, nodes[newParentId].depth || 0);
    nodes[newParentId].children.push(newSubtree.id);
  
    return { nodes };
  }),
  

  }));
  
  export default useTreeStore;
  