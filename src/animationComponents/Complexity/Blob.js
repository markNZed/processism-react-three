import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStoreEntity from './useStoreEntity';

const Blob = ({ color, node, centerRef, entityNodes }) => {
    const worldVector = new THREE.Vector3();
    const blobRef = useRef()
    const blobData = useRef()
    const { getNode, propagateVisualConfigValue, getNodeProperty } = useStoreEntity.getState();
    const { chainRef, id, particlesRef: { current: particles } } = node;
    const worldToLocalFn = node.ref.current.worldToLocal;
    const particleRadius = useMemo(() => getNodeProperty('root', 'particleRadius'), []);
    const [pressStart, setPressStart] = useState(0);
    const longPressThreshold = 500; // Time in milliseconds to distinguish a long press

    // This only runs once upon mounting to build the blobData which acts as a cache for objects
    useEffect(() => {

        blobData.current = {
            positions: [],
            flattenedIndexes: [],
        }

        let blobOuterUniqueIds = [];
        let flattenedIndexes = [];
        for (let i = 0; i < particles.length; ++i) {
            const outerChain = particles[i].current.getVisualConfig().outerChain;
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
                    const uniqueId = particles[i].current.getVisualConfig().uniqueId;
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
            // buildOrderedIds can return null if there are no blobOuterUniqueIds
            const orderedIds = buildOrderedIds(chainRef, blobOuterUniqueIds) || [];
            if (!orderedIds.length) console.error("orderedIds is empty!", id);
            //blobIndexes = filterMiddleIndexes(chainRef, orderedIds);
            blobIndexes = orderedIds;
        }

        for (let i = 0; i < blobIndexes.length; ++i) {
            blobData.current.positions.push(new THREE.Vector3());
            const indexInOuter = blobOuterUniqueIds.indexOf(blobIndexes[i]);
            const flattenedIndex = flattenedIndexes[indexInOuter];
            blobData.current.flattenedIndexes.push(flattenedIndex);
        }

    },[]);

    useFrame(() => {

        if (!blobData.current) return;

        if (node.ref.current.getVisualConfig().visible) {

            const blobPoints = blobData.current.positions.map((positiion, i) => {
                const flattenedIndex = blobData.current.flattenedIndexes[i]
                const pos = particles[flattenedIndex].current.translation();
                worldVector.set(pos.x, pos.y, pos.z);
                positiion.copy(worldToLocalFn(worldVector))
                return positiion;
            });

            if (blobPoints.length) {
                const geometry = points_to_geometry(blobPoints, particleRadius, centerRef);
                blobRef.current.geometry.dispose();
                blobRef.current.geometry = geometry;
                blobRef.current.visible = true;
            }

        } else {
            blobRef.current.visible = false;
        }

    });

    const handleOnClick = (event) => {
        //console.log("Blob handleOnClick", event);
        if (event.shiftKey) {
            return;
        }
        if (event.button !== 0) return;  // ignore two finger tap
        
        const pressDuration = Date.now() - pressStart;

        if (pressDuration < longPressThreshold) {
            let ancestorId = node.parentId;
            for (let i = node.depth - 1; i >= 0; i--) {
                const ancestorNode = getNode(ancestorId);
                if (ancestorNode.ref.current.getVisualConfig().visible) return;
                ancestorId = ancestorNode.parentId;
            }
            event.stopPropagation();
            // If the node is about to become invisible
            if (node.ref.current.getVisualConfig().visible) {
                entityNodes.forEach(nodeEntity => {
                    nodeEntity.ref.current.setVisualConfig(p => ({ ...p, visible: true }));
                });
                node.ref.current.setVisualConfig(p => ({ ...p, visible: false }));
            } else {
                // The order of the blob rendering means everything will disappear
                // causing a "flashing" effect
                node.ref.current.setVisualConfig(p => ({ ...p, visible: true }));
                setTimeout(() => {
                    entityNodes.forEach(nodeEntity => {
                        propagateVisualConfigValue(nodeEntity.id, 'visible', false);
                    });
                }, 0); // Introduce a slight delay to avoid flashing
            }
        }
    };

    const handleOnContextMenu = handleOnContextMenuFn(getNode, propagateVisualConfigValue);

    const handlePointerDown = (event) => {
        //console.log("Blob handlePointerDown", event);
        if (event.button !== 0) return; // ignore two finger tap
        setPressStart(Date.now());
    };
    
    return (
        <mesh ref={blobRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handleOnClick}
            onContextMenu={(event) => handleOnContextMenu(event)}>
            <meshBasicMaterial color={color} />
        </mesh>
    );
};

export default Blob;

// Outside of component to avoid recreation on render
 
const points_to_geometry = (points, particleRadius = 0, centerRef) => {
    const expandPointsFromCenter = (points, distance, center) => {
        return points.map(point => {
            const direction = new THREE.Vector3().subVectors(point, center).normalize();
            return new THREE.Vector3(
                point.x + direction.x * distance,
                point.y + direction.y * distance,
                point.z + direction.z * distance
            );
        });
    };

    // Ensure centerRef is a Vector3
    const center = centerRef.current;

    // Offset the points before creating the curve
    const expandedPoints = expandPointsFromCenter(points, particleRadius, center);

    const curve = new THREE.CatmullRomCurve3(expandedPoints, true);
    const oneToOnePoints = curve.getPoints(expandedPoints.length);
    const shape = new THREE.Shape(oneToOnePoints);
    const shape_geometry = new THREE.ShapeGeometry(shape);

    return shape_geometry;
};

function handleOnContextMenuFn(getNode, propagateVisualConfigValue) {
    return (event) => {
        //console.log("Blob handleOnContextMenuFn", event);
        event.stopPropagation();
        const rootNode = getNode("root");
        rootNode.ref.current.setVisualConfig(p => ({ ...p, visible: true }));
        setTimeout(() => {
            rootNode.childrenIds.forEach(childId => {
                propagateVisualConfigValue(childId, 'visible', false);
            });
        }, 0); // Introduce a slight delay to avoid flashing
    };
}

/**
 * Recursively builds the ordered list of indexes.
 * @param {Object} chainRef - Reference object containing the current state of chains.
 * @param {Array} blobOuterUniqueIds - Array of unique IDs representing the outer blob.
 * @param {string|null} [uniqueId=null] - The current unique ID to process.
 * @param {Set} [visited=new Set()] - A set of visited unique IDs to prevent infinite loops.
 * @returns {Array|null} Ordered list of indexes or null if a chainRef is dangling.
 */
function buildOrderedIds(chainRef, blobOuterUniqueIds, uniqueId = null, visited = new Set()) {
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
            const recursiveResult = buildOrderedIds(chainRef, blobOuterUniqueIds, linkedIndex, visited);
            if (recursiveResult) {
                foundJoint = true;
                result.push(...recursiveResult);
            }
        }
    }
    
    // If no joints were found, continue with the normal linked indexes
    if (!foundJoint) {
        for (let linkedIndex of linkedIndexes) {
            const recursiveResult = buildOrderedIds(chainRef, blobOuterUniqueIds, linkedIndex, visited);
            if (recursiveResult) {
                result.push(...recursiveResult);
            }
        }
    }
    
    return result;
}