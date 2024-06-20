import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStoreEntity from './useStoreEntity';

/**
 * Recursively builds the ordered list of indexes.
 * @param {Object} chainRef - Reference object containing the current state of chains.
 * @param {Array} blobOuterUniqueIds - Array of unique IDs representing the outer blob.
 * @param {string|null} [uniqueId=null] - The current unique ID to process.
 * @param {Set} [visited=new Set()] - A set of visited unique IDs to prevent infinite loops.
 * @returns {Array|null} Ordered list of indexes or null if a chainRef is dangling.
 */
function buildOrderedIndexes(chainRef, blobOuterUniqueIds, uniqueId = null, visited = new Set()) {
    // Initialize uniqueId with the first element of blobOuterUniqueIds if null
    if (uniqueId === null) {
        uniqueId = blobOuterUniqueIds[0];
    }

    // Guard clause to prevent infinite loops
    if (visited.has(uniqueId)) return null;
    
    visited.add(uniqueId);
    
    // Guard clause to check if uniqueId is in blobOuterUniqueIds
    if (!blobOuterUniqueIds.includes(uniqueId)) return null;
    
    const result = [uniqueId];
    const linkedIndexes = chainRef.current[uniqueId];
    
    // Check if there are any joints (nodes with more than 2 links)
    let foundJoint = false;
    for (let linkedIndex of linkedIndexes) {
        if (chainRef.current[linkedIndex].length > 2) {
            const recursiveResult = buildOrderedIndexes(chainRef, blobOuterUniqueIds, linkedIndex, visited);
            if (recursiveResult) {
                foundJoint = true;
                result.push(...recursiveResult);
            }
        }
    }
    
    // If no joints were found, continue with the normal linked indexes
    if (!foundJoint) {
        for (let linkedIndex of linkedIndexes) {
            const recursiveResult = buildOrderedIndexes(chainRef, blobOuterUniqueIds, linkedIndex, visited);
            if (recursiveResult) {
                result.push(...recursiveResult);
            }
        }
    }
    
    return result;
}

const Blob = ({ color, node }) => {
    const worldVector = new THREE.Vector3();
    const blobRef = useRef()
    const blobData = useRef()
    const { updateNode, getNode, propagateValue } = useStoreEntity.getState();
    const { chainRef, id, particlesRef: { current: particles } } = node;
    const worldToLocalFn = node.ref.current.worldToLocal;

    // This only runs once upon mounting to build the blobData which acts as a cache for objects
    useEffect(() => {

        blobData.current = {
            positions: [],
            flattenedIndexes: [],
        }

        let blobOuterUniqueIds = [];
        let flattenedIndexes = [];
        for (let i = 0; i < particles.length; ++i) {
            const outerChain = particles[i].current.getUserData().outerChain;
            if (outerChain) {
                let outer = outerChain[node.depth];
                if (outer) {
                    for (let j = Object.keys(outerChain).length - 1;j > node.depth; j--) {
                        if (!outerChain[j.toString()]) {
                            outer = false;
                            break;
                        }
                    }
                }
                if (outer) {
                    const uniqueId = particles[i].current.getUserData().uniqueId;
                    blobOuterUniqueIds.push(uniqueId);
                    flattenedIndexes.push(i);
                }
            }
        }

        if (!blobOuterUniqueIds.length) {
            console.error("blobOuterUniqueIds is empty!", id, particles.length);
        }

        let blobIndexes;
        if (node.lastCompoundEntity) {
            blobIndexes = blobOuterUniqueIds;
        } else {
            // buildOrderedIndexes can return null if there are no blobOuterUniqueIds
            const orderedIndexes = buildOrderedIndexes(chainRef, blobOuterUniqueIds) || [];
            if (!orderedIndexes.length) console.error("orderedIndexes is empty!", id);
            //blobIndexes = filterMiddleIndexes(chainRef, orderedIndexes);
            blobIndexes = orderedIndexes;
        }

        for (let i = 0; i < blobIndexes.length; ++i) {
            blobData.current.positions.push(new THREE.Vector3());
            const indexInOuter = blobOuterUniqueIds.indexOf(blobIndexes[i]);
            const flattenedIndex = flattenedIndexes[indexInOuter];
            blobData.current.flattenedIndexes.push(flattenedIndex);
        }

        updateNode(id, {visible: node.depth == 0})

    },[]);

    useFrame(() => {

        if (!blobData.current) return;

        // We have nodes for the particles
        if (node.lastCompoundEntity) {
            for (let i = 0; i < particles.length; i++) {
                // Could add config option to show particles
                particles[i].current.getUserData().visible = node.visibleParticles;
            }
        }

        if (node.visible) {

            const blobPoints = blobData.current.positions.map((positiion, i) => {
                const flattenedIndex = blobData.current.flattenedIndexes[i]
                const pos = particles[flattenedIndex].current.translation();
                worldVector.set(pos.x, pos.y, pos.z);
                positiion.copy(worldToLocalFn(worldVector))
                return positiion;
            });

            if (blobPoints.length) {
                const geometry = points_to_geometry(blobPoints);
                blobRef.current.geometry.dispose();
                blobRef.current.geometry = geometry;
                blobRef.current.visible = node.visible;
            }

        } else {
            blobRef.current.visible = false;
        }

    });

    const handleOnClick = handleOnClickFn(getNode, updateNode, propagateValue, id);

    const handleOnContextMenu = handleOnContextMenuFn(updateNode, getNode, propagateValue);
    
    return (
        <mesh ref={blobRef}
            onClick={(event) => handleOnClick(event, node)}
            onContextMenu={(event) => handleOnContextMenu(event)}>
            <meshBasicMaterial color={color} />
        </mesh>
    );
};

export default Blob;

// Outside of component to avoid recreation on render
 
const points_to_geometry = points => {
    const curve = new THREE.CatmullRomCurve3(points, true)
    //const ten_fold_points = curve.getPoints(points.length * 10)
    //const shape = new THREE.Shape(ten_fold_points)
    const oneToOnePoints = curve.getPoints(points.length)
    const shape = new THREE.Shape(oneToOnePoints)
    const shape_geometry = new THREE.ShapeGeometry(shape)
    return shape_geometry
}

function handleOnContextMenuFn(updateNode, getNode, propagateValue) {
    return useCallback((event) => {
        event.stopPropagation();
        updateNode("root", { visible: true });
        const rootNode = getNode("root");
        rootNode.childrenIds.forEach(childId => {
            propagateValue(childId, "visible", false);
        });
    }, []);
}

function handleOnClickFn(getNode, updateNode, propagateValue, id) {
    return useCallback((event, node) => {
        let ancestorId = node.parentId;
        for (let i = node.depth - 1; i >= 0; i--) {
            const ancestorNode = getNode(ancestorId);
            if (ancestorNode.visible) return;
            ancestorId = ancestorNode.parentId;
        }
        event.stopPropagation();
        const updateNodeValue = { visible: !node.visible };
        if (node.lastCompoundEntity) updateNodeValue.visibleParticles = node.visible;
        // If the node is about to become invisible
        if (node.visible) {
            node.childrenIds.forEach(childId => {
                updateNode(childId, { visible: true });
            });
        } else {
            node.childrenIds.forEach(childId => {
                propagateValue(childId, "visible", false);
            });
        }
        updateNode(id, updateNodeValue);
    }, []);
}
