import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStoreScope from './useStoreScope';
import useStoreEntity from './useStoreEntity';

const Blob = ({ color, node }) => {
    const worldVector = new THREE.Vector3();
    const blobRef = useRef()
    const blobData = useRef()
    const updateNode = useStoreEntity.getState().updateNode;
    const getNode = useStoreEntity.getState().getNode; // Direct access to the state outside of React's render flow
    const propagateValue = useStoreEntity.getState().propagateValue
    const getScope = useStoreScope(useCallback((state) => state.getScope, []));
    const chainRef = node.chainRef;
    const scope = getScope(node.depth);
    const worldToLocalFn = node.ref.current.worldToLocal;
    const id = node.id;
    const particles = node.particlesRef.current;

    // Helper function to recursively build the ordered list
    // Returns null if a chainRef is dangling
    function buildOrderedIndexes(chainRef, blobOuterUniqueIdes, uniqueId = null, visited = new Set()) {
        if (uniqueId === null) {
            uniqueId = blobOuterUniqueIdes[0];
        }
        const result = [];
        // Prevent infinite loops
        if (visited.has(uniqueId)) return null;
        visited.add(uniqueId);
        if (blobOuterUniqueIdes.includes(uniqueId)) {
            result.push(uniqueId)
        } else {
            // chain is dangling (not looping)
            return null;
        }
        const linkedIndexes = chainRef.current[uniqueId];
        let foundJoint = false
        // Joints have more than 2 links
        if (linkedIndexes.length > 2) {
            for (let i = 0; i < linkedIndexes.length; i++) {
                if (chainRef.current[linkedIndexes[i]].length > 2) {
                    const recursiveResult = buildOrderedIndexes(chainRef, blobOuterUniqueIdes, linkedIndexes[i], visited);
                    if (recursiveResult) {
                        foundJoint = true;
                        result.push(...recursiveResult);
                    }
                }
            }
        }
        if (!foundJoint) {
            for (let i = 0; i < linkedIndexes.length; i++) {
                const recursiveResult = buildOrderedIndexes(chainRef, blobOuterUniqueIdes, linkedIndexes[i], visited)
                if (recursiveResult) {
                    result.push(...recursiveResult);
                    // recursiveResult is not null but it may be dangling further along the chain
                }
            }
        }
        return result;
    }

    function filterMiddleIndexes(chainRef, indexes) {
        const jointIndexes = [];
        // Find all indexes from the provided list that are joints i.e. more than 2 links
        for (let i = 0; i < indexes.length; i++) {
            const idx = indexes[i];
            if (chainRef.current[idx].length > 2) {
                // Check it is a link on this depth
                const linkedIndexes = chainRef.current[idx];
                let onChain = true;
                onChain = false;
                // If the joint was not created at this depth then skip
                for (let j = 0; j < linkedIndexes.length; j++) {
                    const jointIndex = `${idx}-${linkedIndexes[j]}`;
                    if (scope.joints.includes(jointIndex)) {
                        onChain = true;
                        break;
                    }
                }
                if (onChain) jointIndexes.push(i);
            }
        }
        const middleIndexes = [];
        // Find indexes that are in the middle between joints
        for (let i = 1; i < jointIndexes.length; i++) {
            // Calculate the middle index
            const midIndex = Math.floor((jointIndexes[i - 1] + jointIndexes[i]) / 2);
            // Avoid duplicating joints
            if (!jointIndexes.includes(midIndex)) {
                //middleIndexes.push(indexes[jointIndexes[i - 1]]);
                middleIndexes.push(indexes[midIndex]);
            }
        }
        // Calculate the middle position between the first and last link with wraparound
        const firstJoint = jointIndexes[0];
        const lastJoint = jointIndexes[jointIndexes.length - 1];
        const indexesLength = indexes.length;
        const distance = (indexesLength - lastJoint + firstJoint);
        const middle = (lastJoint + Math.floor(distance / 2)) % indexes.length;
        //middleIndexes.push(indexes[lastJoint]);
        middleIndexes.push(indexes[middle]);
        return middleIndexes;
    }

    useEffect(() => {

        blobData.current = {
            positions: [],
            flattenedIndexes: [],
        }

        let blobOuterUniqueIdes = [];
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
                    blobOuterUniqueIdes.push(uniqueId);
                    flattenedIndexes.push(i);
                }
            }
        }

        if (!blobOuterUniqueIdes.length) {
            console.error("blobOuterUniqueIdes is empty!", id, particles.length);
        }

        let blobIndexes;
        if (node.lastCompoundEntity) {
            blobIndexes = blobOuterUniqueIdes;
        } else {
            // buildOrderedIndexes can return null if there are no blobOuterUniqueIdes
            const orderedIndexes = buildOrderedIndexes(chainRef, blobOuterUniqueIdes) || [];
            if (!orderedIndexes.length) console.error("orderedIndexes is empty!", id);
            //blobIndexes = filterMiddleIndexes(chainRef, orderedIndexes);
            blobIndexes = orderedIndexes;
        }

        for (let i = 0; i < blobIndexes.length; ++i) {
            blobData.current.positions.push(new THREE.Vector3());
            const indexInOuter = blobOuterUniqueIdes.indexOf(blobIndexes[i]);
            const flattenedIndex = flattenedIndexes[indexInOuter];
            blobData.current.flattenedIndexes.push(flattenedIndex);
        }

        updateNode(id, {visible: node.depth == 0})

    },[]);

    useFrame(() => {

        if (!blobData.current) return;

        // Probably don't need anything special for this because we have nodes for the particles
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

    const handleOnClick = useCallback((event, node) => {
        let ancestorId = node.parentId;
        for (let i = node.depth - 1; i >= 0; i--) {
            const ancestorNode = getNode(ancestorId);
            if (ancestorNode.visible) return;
            ancestorId = ancestorNode.parentId;
        }
        event.stopPropagation();
        const updateNodeValue = { visible: !node.visible };
        if (node.lastCompoundEntity) updateNodeValue.visibleParticles = node.visible;
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

    const handleOnContextMenu = useCallback((event) => {
        event.stopPropagation();
        updateNode("root", { visible: true });
        const rootNode = getNode("root");
        rootNode.childrenIds.forEach(childId => {
            propagateValue(childId, "visible", false);
        });
    }, []);
    
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