import React from 'react';
import { create } from 'zustand';
import uniqueIdGenerator from './uniqueIdGenerator';
import { devtools } from 'zustand/middleware';
import * as utils from './utils';

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
 * import useStoreEntity from './path-to-store';
 * 
 * // Access the store
 * const store = useStoreEntity();
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

// Should distinguish operations that can change nodeCount

const nodeTemplate = {
    isParticle: false,
    parentId: null,
    chainRef: (() => { // Shared by all nodes
        const ref = React.createRef();
        ref.current = {};  // Initialize .current with an empty object
        return ref;
    })(),
    initialPosition: null,
};

const propertyLookupIncludes = ['depth', 'isParticle'];

// Function to create a new node with given properties and childrenIds.
const createNode = (id = null, properties = {}, childrenIds = []) => {
    const node = {
        ...nodeTemplate,
        id: id || uniqueIdGenerator.getNextId(),
        ref: React.createRef(),
        childrenIds,
        relationsRef: (() => {
            const ref = React.createRef();
            ref.current = [];  // Initialize .current with an empty object
            return ref;
        })(),
        particlesRef: (() => {
            const ref = React.createRef();
            ref.current = [];  // Initialize .current with an empty object
            return ref;
        })(),
        jointsRef: (() => {
            const ref = React.createRef();
            ref.current = [];  // Initialize .current with an empty object
            return ref;
        })(),
        ...properties,
    };
    return node;
};

// Helper function to remove a node from its parent's childrenIds array.
const removeNodeFromParent = (nodes, nodeId) => {
    for (let key in nodes) {
        const node = nodes[key];
        if (node.childrenIds.includes(nodeId)) {
            node.childrenIds = node.childrenIds.filter(childId => childId !== nodeId);
            break;
        }
    }
};

// Utility function to update property lookups when adding or updating nodes.
const updatePropertyLookups = (node, propertyLookups) => {
    const updatedLookups = { ...propertyLookups };
    Object.keys(node).forEach(prop => {
        if (propertyLookupIncludes.includes(prop)) {
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

function simpleHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

const useStoreEntity = create((set, get) => {

    const rootNode = createNode('root', { depth: 0, parentId: null }, []);

    return {
            
        // Initial state with a root node.
        nodes: {root: rootNode},
        // Object to maintain lookups for node properties.
        propertyLookups: {},
        nodeCount: 0,
        relations: {},
        relationCount: 0,
        joints: {},
        jointCount: 0,
        particlesStable: {},
        particleRefs: [],

        getparticlesHash: (id) => {
            return get().particlesStable[id];
        },

        resetParticlesStable: () => set(() => {
            console.log("resetParticlesStable")
            return {
                particlesStable: {}
            };
        }),

        reset: () => set(() => {
            return {
                nodes: {root: rootNode},
                propertyLookups: {},
                nodeCount: 0,
                relations: {},
                relationCount: 0,
                joints: {},
                jointCount: 0,
            }
        }),

        addJoint: (body1Id, body2Id, ref) => set(state => {
            const joints = state.joints;
            const jointId = utils.jointId(body1Id, body2Id);
            joints[jointId] = [ref, body1Id, body2Id]; // Store the order the joint was created in (important for offset)
            const nodes = state.nodes;
            nodes[body1Id].jointsRef.current.push(jointId);
            nodes[body2Id].jointsRef.current.push(jointId);
            const jointCount = state.jointCount + 1;
            //console.log("addJoint", jointId, jointCount)
            return {
                jointCount,
                joints,
                nodes,
            };
        }),

        addJoints: (jointsToAdd) => set(state => {
            const joints = state.joints;
            const nodes = state.nodes;
            let jointCount = state.jointCount;
            jointsToAdd.forEach(([body1Id, body2Id, ref]) => {
                const jointId = utils.jointId(body1Id, body2Id);
                joints[jointId] = ref;
                nodes[body1Id].jointsRef.current.push(jointId);
                nodes[body2Id].jointsRef.current.push(jointId);
                jointCount++;
                //console.log("addJoints", jointId, jointCount)
            }); 
            return {
                jointCount,
                joints,
                nodes,
            };
        }),

        deleteJoint: (body1Id, body2Id) => set(state => {
            const joints = state.joints;
            const jointId = utils.jointId(body1Id, body2Id);
            const body1Node = state.nodes[body1Id];
            const body2Node = state.nodes[body2Id];
            delete joints[jointId];
            body1Node.jointsRef.current = body1Node.jointsRef.current.filter(id => id !== jointId);
            body2Node.jointsRef.current = body2Node.jointsRef.current.filter(id => id !== jointId);
            const jointCount = state.jointCount - 1;
            return {
                jointCount,
                joints,
                nodes: {...state.nodes, [body1Id]: body1Node, [body2Id]: body2Node},
            };
        }),

        deleteJointId: (jointId) => {
            const [body1Id, body2Id] = utils.jointIdToNodeIds(jointId);
            get().deleteJoint(body1Id, body2Id);
        },

        getJoint: (jointId) => {
            const joints = get().joints;
            return joints[jointId];
        },

        getJoints: () => {
            return get().joints;
        },

        updateJoint: (jointId, body1Id, body2Id, ref) => set(state => {
            const joints = state.joints;
            joints[jointId] = [ref, body1Id, body2Id]; // Store the order the joint was created in (important for offset)
            return {
                joints,
            };
        }),

        addRelation: (fromId, toId) => set(state => {
            const relations = state.relations;
            if (!relations[fromId]) relations[fromId] = [];
            relations[fromId].push(toId);
            const fromNode = state.nodes[fromId];
            fromNode.relationsRef.current.push(toId);
            const relationCount = state.relationCount + 1;
            return {
                relations,
                nodes: {...state.nodes, [fromId]: fromNode},
                relationCount,
            };
        }),

        deleteRelation: (fromId, toId = null) => set(state => {
            const relations = state.relations;
            const fromNode = state.nodes[fromId];
            if (toId) {
                relations[fromId] = relations[fromId].filter(id => id !== toId);
                fromNode.relationsRef.current = fromNode.relationsRef.current.filter(id => id !== toId);
            } else {
                delete relations[fromId];
                fromNode.relationsRef.current = [];
            }
            const relationCount = state.relationCount - 1;
            return {
                relations,
                nodes: {...state.nodes, [fromId]: fromNode},
                relationCount,
            };
        }),

        getRelations: () => {
            return get().relations;
        },

        getRelationCount: () => {
            return get().relationCount;
        },

        getNodeCount: () => {
            return get().nodeCount;
        },


        getNode: (nodeId) => {
            const nodes = get().nodes;
            return nodes[nodeId];
        },

        selectNodeById: (id) => (state) => state.nodes[id],

        getAllNodes: () => get().nodes,

        getAllpropertyLookups: () => get().propertyLookups,

        getProperty: (prop, index) => {
            const propertyLookup = get().propertyLookups[prop];
            if (!propertyLookup) throw new Error(`Property ${prop} does not exist`);
            return propertyLookup[index];
        },

        getPropertyAll: (prop) => get().propertyLookups[prop],

        getPropertyAllKeys: (prop) => Object.keys(get().propertyLookups[prop]),

        getNodeProperty: (nodeId, property) => {
            const node = get().getNode(nodeId);
            if (!node) throw new Error(`Node ${nodeId} does not exist`);
            return node[property];
        },

        // Function to get all nodes with isParticle set to true.
        // Cache the result in state.particles
        getAllParticleRefs: (id = 'root') => {
            const particlesStable = get().particlesStable[id];
            if (!particlesStable) {
                const particles = [];
                const nodes = get().nodes;
                const traverse = (node) => {
                    if (node.isParticle) {
                        particles.push(node.ref);
                    }
                    if (node.childrenIds && Array.isArray(node.childrenIds)) {
                        node.childrenIds.forEach(childId => traverse(nodes[childId]));
                    }
                };
                traverse(nodes[id]);
                let concatenatedIds = particles.reduce((acc, particle) => {
                    let uniqueId = particle.current.getVisualConfig().uniqueId;
                    return acc + uniqueId; // Concatenate all uniqueIds
                }, "");
                // We include the date so resetting particlesStable will force a refresh
                // That will in turn take into account joint updates
                // This is very hacky!
                let hashedResult = simpleHash(concatenatedIds).toString() + Date.now().toString();
                //console.log("hashedResult", id, particles, hashedResult)
                set((state) => ({
                    particlesStable: {
                        ...state.particlesStable, 
                        [id]: hashedResult
                    },
                    particles: {
                        ...state.particles,
                        [id]: particles
                    }
                }))
                return particles;
            } else {
                return get().particles[id] || [];
            }
        },

        // Function to add a new node to the tree.
        addNode: (parentId, node = {}, id = null) => {
            let newNodeId;
            set(state => {
                if (state.nodes[node.id]) throw new Error(`Node ID ${node.id} already exists`);
                const parentNode = state.nodes[parentId];
                if (!parentNode) {
                    //console.log("state.nodes", state.nodes)
                    throw new Error(`Parent node ${parentId} does not exist when creating node ${JSON.stringify(node)} with id ${id}`);
                }

                const nodeDepth = (parentNode.depth || 0) + 1;
                const newNode = createNode(id, { ...node, depth: nodeDepth, parentId: parentId }, node.childrenIds || []);
                newNodeId = newNode.id;
                state.nodeCount++;

                state.particlesStable = {};

                return {
                    nodes: {
                        ...state.nodes,
                        [newNode.id]: newNode,
                        [parentId]: {
                            ...parentNode,
                            isParticle: false,
                            childrenIds: [...(parentNode.childrenIds || []), newNode.id],
                        },
                    },
                    propertyLookups: updatePropertyLookups(newNode, state.propertyLookups),
                };
            });
            return newNodeId;
        },

        // Function to update an existing node's properties.
        updateNode: (id, updates) => set(state => {
            const node = state.nodes[id];
            if (!node) {
                console.error(`Node ${id} does not exist`, id)
                throw new Error(`Node ${id} does not exist`);
            }
            const isParticle = node.isParticle;

            // Allow updates to be a function similar to setState
            const updatedProperties = typeof updates === 'function' ? updates(node) : updates;

            // Update property lookups before applying changes
            const updatedLookups = { ...state.propertyLookups };
            Object.keys(updatedProperties).forEach(prop => {
                if (propertyLookupIncludes.includes(prop)) {
                    const oldValues = Array.isArray(node[prop]) ? node[prop] : node[prop] ? [node[prop]] : [];
                    const newValues = Array.isArray(updatedProperties[prop]) ? updatedProperties[prop] : [updatedProperties[prop]];

                    oldValues.forEach(value => {
                        if (updatedLookups[prop] && updatedLookups[prop][value]) {
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

            const newDepth = updatedProperties.parentId ? (state.nodes[updatedProperties.parentId].depth || 0) + 1 : node.depth;

            if (isParticle !== updatedProperties.isParticle) {
                state.particlesStable = {};
            }

            return {
                nodes: {
                    ...state.nodes,
                    [id]: {
                        ...node,
                        ...updatedProperties,
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
                        if (propertyLookupIncludes.includes(prop) && propertyLookups[prop]) {
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
                    node.childrenIds.forEach(childId => deleteRecursively(childId));
                    delete nodes[nodeId];
                    state.nodeCount--;
                    delete state.relations[nodeId];
                }
            };

            if (node.isParticle) {
                state.particlesStable = {};
            }

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
                nodes[nId].childrenIds.forEach(childId => updateDepthRecursively(childId, depth + 1));
            };

            updateDepthRecursively(nodeId, newDepth);

            return {
                nodes: {
                    ...nodes,
                    [newParentId]: {
                        ...newParentNode,
                        childrenIds: [...(newParentNode.childrenIds || []), nodeId],
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
                if (node.childrenIds && Array.isArray(node.childrenIds)) {
                    node.childrenIds.forEach(childId => {
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
        traverseTreeDFS: (callback, id = 'root') => {
            const nodes = get().nodes;
            const traverse = (node) => {
                callback(node);
                if (node.childrenIds && Array.isArray(node.childrenIds)) {
                    node.childrenIds.forEach(childId => traverse(nodes[childId]));
                }
            };
            traverse(nodes[id]);
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
                    childrenIds: [],
                };
                newNode.childrenIds = node.childrenIds.map(childId => {
                    const copiedChild = copyRecursively(nodes[childId], newDepth);
                    return copiedChild.id;
                });
                nodes[newNode.id] = newNode;
                state.nodeCount++;
                return newNode;
            };

            const nodeToCopy = nodes[nodeId];
            const newSubtree = copyRecursively(nodeToCopy, nodes[newParentId].depth || 0);
            nodes[newParentId].childrenIds.push(newSubtree.id);

            return { nodes };
        }),

        propagateValue: (nodeId, property, value) => set(state => {
            const nodes = { ...state.nodes };

            const updateSubtree = (currentId) => {
                nodes[currentId][property] = value;
                if (nodes[currentId].childrenIds && Array.isArray(nodes[currentId].childrenIds)) {
                    nodes[currentId].childrenIds.forEach(childId => updateSubtree(childId));
                }
            };

            updateSubtree(nodeId);

            if (property === 'isParticle') {
                state.particlesStable = {};
            }

            return { nodes };
        }),

        propagateVisualConfigValue: (nodeId, property, value) => set(state => {
            const nodes = { ...state.nodes };

            const updateSubtree = (currentId) => {
                // If a node has not appeared yet then the ref will be null
                if (nodes[currentId]['ref']['current']) {
                    nodes[currentId]['ref']['current'].setVisualConfig(p => ({ ...p, [property]: value }));
                    if (nodes[currentId].childrenIds && Array.isArray(nodes[currentId].childrenIds)) {
                        nodes[currentId].childrenIds.forEach(childId => updateSubtree(childId));
                    }
                }
            };

            updateSubtree(nodeId);

            return { nodes };
        }),
    };

});


export default useStoreEntity;