import create from 'zustand';

// Define the node structure
const createNode = (id, properties = {}, children = []) => ({
  id,
  ...properties,
  children,
});

const removeNodeFromParent = (nodes, nodeId) => {
  for (let key in nodes) {
    const node = nodes[key];
    if (node.children.includes(nodeId)) {
      node.children = node.children.filter(childId => childId !== nodeId);
      break;
    }
  }
};

const useTreeStore = create((set, get) => ({
  nodes: {
    root: createNode('root'),
  },
  addNode: (parentId, node) => set(state => {
    if (state.nodes[node.id]) throw new Error(`Node ID ${node.id} already exists`);
    
    const parentNode = state.nodes[parentId];
    if (!parentNode) throw new Error(`Parent node ${parentId} does not exist`);
  
    return {
      nodes: {
        ...state.nodes,
        [node.id]: node,
        [parentId]: {
          ...parentNode,
          children: [...parentNode.children, node.id],
        },
      },
    };
  }),  
  updateNode: (id, updates) => set(state => {
    const node = state.nodes[id];
    if (!node) throw new Error(`Node ${id} does not exist`);

    return {
      nodes: {
        ...state.nodes,
        [id]: {
          ...node,
          ...updates,
        },
      },
    };
  }),
  moveNode: (nodeId, newParentId) => set(state => {
    const nodes = { ...state.nodes };
    const nodeToMove = nodes[nodeId];
    if (!nodeToMove) throw new Error(`Node ${nodeId} does not exist`);

    const newParentNode = nodes[newParentId];
    if (!newParentNode) throw new Error(`New parent node ${newParentId} does not exist`);

    removeNodeFromParent(nodes, nodeId);

    return {
      nodes: {
        ...nodes,
        [newParentId]: {
          ...newParentNode,
          children: [...newParentNode.children, nodeId],
        },
      },
    };
  }),
  deleteNode: (id) => set(state => {
    const nodes = { ...state.nodes };
    if (!nodes[id]) throw new Error(`Node ${id} does not exist`);

    const deleteRecursively = (nodeId) => {
      const node = nodes[nodeId];
      if (node) {
        node.children.forEach(childId => deleteRecursively(childId));
        delete nodes[nodeId];
      }
    };

    deleteRecursively(id);
    removeNodeFromParent(nodes, id);

    return { nodes };
  }),
  getNode: (id) => get().nodes[id],
  findNodesByProperty: (property, value) => {
    const nodes = get().nodes;
    return Object.values(nodes).filter(node => node[property] === value);
  },
  flattenTree: () => {
    const nodes = get().nodes;
    const result = [];
    const flatten = (node) => {
      result.push(node);
      node.children.forEach(childId => flatten(nodes[childId]));
    };
    flatten(nodes['root']);
    return result;
  },
  traverseTreeDFS: (callback) => {
    const nodes = get().nodes;
    const traverse = (node) => {
      callback(node);
      node.children.forEach(childId => traverse(nodes[childId]));
    };
    traverse(nodes['root']);
  },
  copySubtree: (nodeId, newParentId) => set(state => {
    const nodes = { ...state.nodes };
    if (!nodes[nodeId]) throw new Error(`Node ${nodeId} does not exist`);
    if (!nodes[newParentId]) throw new Error(`New parent node ${newParentId} does not exist`);

    const copyRecursively = (node) => {
      const newNode = { ...node, id: `${node.id}_copy`, children: [] };
      nodes[newNode.id] = newNode;
      node.children.forEach(childId => {
        const copiedChild = copyRecursively(nodes[childId]);
        newNode.children.push(copiedChild.id);
      });
      return newNode;
    };

    const nodeToCopy = nodes[nodeId];
    const newSubtree = copyRecursively(nodeToCopy);
    nodes[newParentId].children.push(newSubtree.id);

    return { nodes };
  }),
}));

export default useTreeStore