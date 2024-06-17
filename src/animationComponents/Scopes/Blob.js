import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useScopeStore from './useScopeStore';
import useEntityStore from './useEntityStore';

const Blob = ({ particleRefs, lastCompoundEntity, color, node }) => {
    const prevParentVisibleRef = useRef(true);
    const worldVector = new THREE.Vector3();
    const blobRef = useRef()
    const blobData = useRef()
    const {
        updateNode,
        getNode,
        propagateValue,
    } = useEntityStore(); 
    const chainRef = useRef(node.chain);
    const { setScope, getScope, addScope, removeScope, clearScope, clearAllScopes } = useScopeStore();
    const scopeNode = getScope(node.depth);
    const worldToLocalFn = node.ref.current.worldToLocal;
    const id = node.id;

    // Helper function to recursively build the ordered list
    // Returns null if a chain is dangling
    function buildOrderedIndexes(chainRef, blobOuterUniqueIndexes, uniqueIndex = null, visited = new Set()) {
        if (uniqueIndex === null) {
            uniqueIndex = blobOuterUniqueIndexes[0];
        }
        const result = [];
        // Prevent infinite loops
        if (visited.has(uniqueIndex)) return null;
        visited.add(uniqueIndex);
        if (blobOuterUniqueIndexes.includes(uniqueIndex)) {
            result.push(uniqueIndex)
        } else {
            // chain is dangling (not looping)
            return null;
        }
        const linkedIndexes = chainRef.current[uniqueIndex];
        let foundJoint = false
        // Joints have more than 2 links
        if (linkedIndexes.length > 2) {
            for (let i = 0; i < linkedIndexes.length; i++) {
                if (chainRef.current[linkedIndexes[i]].length > 2) {
                    const recursiveResult = buildOrderedIndexes(chainRef, blobOuterUniqueIndexes, linkedIndexes[i], visited);
                    if (recursiveResult) {
                        foundJoint = true;
                        result.push(...recursiveResult);
                    }
                }
            }
        }
        if (!foundJoint) {
            for (let i = 0; i < linkedIndexes.length; i++) {
                const recursiveResult = buildOrderedIndexes(chainRef, blobOuterUniqueIndexes, linkedIndexes[i], visited)
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
                    if (scopeNode.joints.includes(jointIndex)) {
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

        let blobOuterUniqueIndexes = [];
        let flattenedIndexes = [];
        for (let i = 0; i < particleRefs.length; ++i) {
            const scopeOuter = particleRefs[i].current.getUserData().scopeOuter;
            if (scopeOuter) {
                let outer = scopeOuter[node.depth];
                if (outer) {
                    for (let j = Object.keys(scopeOuter).length - 1;j > node.depth; j--) {
                        if (!scopeOuter[j.toString()]) {
                            outer = false;
                            break;
                        }
                    }
                }
                if (outer) {
                    const uniqueIndex = particleRefs[i].current.getUserData().uniqueIndex;
                    blobOuterUniqueIndexes.push(uniqueIndex);
                    flattenedIndexes.push(i);
                }
            }
        }

        if (!blobOuterUniqueIndexes.length) {
            console.error("blobOuterUniqueIndexes is empty!", id, particleRefs.length);
        }

        let blobIndexes;
        if (lastCompoundEntity) {
            blobIndexes = blobOuterUniqueIndexes;
        } else {
            // buildOrderedIndexes can return null if there are no blobOuterUniqueIndexes
            const orderedIndexes = buildOrderedIndexes(chainRef, blobOuterUniqueIndexes) || [];
            if (!orderedIndexes.length) console.error("orderedIndexes is empty!", id);
            //blobIndexes = filterMiddleIndexes(chainRef, orderedIndexes);
            blobIndexes = orderedIndexes;
        }

        for (let i = 0; i < blobIndexes.length; ++i) {
            blobData.current.positions.push(new THREE.Vector3());
            const indexInOuter = blobOuterUniqueIndexes.indexOf(blobIndexes[i]);
            const flattenedIndex = flattenedIndexes[indexInOuter];
            blobData.current.flattenedIndexes.push(flattenedIndex);
        }

        updateNode(id, {visible: node.depth == 0})

    },[]);

    const points_to_geometry = points => {
        const curve = new THREE.CatmullRomCurve3(points, true)
        const ten_fold_points = curve.getPoints(points.length * 10)
        const shape = new THREE.Shape(ten_fold_points)
        const shape_geometry = new THREE.ShapeGeometry(shape)
        return shape_geometry
    }

    useFrame(() => {

        if (!blobData.current) return;

        // Probably don't need anything specai lfor this because we have nodes for th eparticles
        if (lastCompoundEntity) {
            for (let i = 0; i < particleRefs.length; i++) {
                // Could add config option to show particles
                particleRefs[i].current.getUserData().visible = node.visibleParticles;
            }
        }

        if (node.visible) {

            const blobPoints = blobData.current.positions.map((positiion, i) => {
                const flattenedIndex = blobData.current.flattenedIndexes[i]
                const pos = particleRefs[flattenedIndex].current.translation();
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

    const handleOnClick = (event) => {
        //console.log("handleOnClick", "event:", event, "node.visible:", node.visible, "depth:", node.depth)
        // If a higher blob is visible then ignore
        // Walk up the tree but this is wrong as it also need to go down the branch
        let ancestorId = node.parentId;
        for (let i = node.depth - 1; i >= 0; i--) {
            const ancestorNode = getNode(ancestorId) ;
            if (ancestorNode.visible) return;
            ancestorId = ancestorNode.parentId
        }
        // Stop the event from bubbling up
        event.stopPropagation();
        // Alternate visibility
        const updateNodeValue = {};
        updateNodeValue["visible"] = !node.visible;
        if (lastCompoundEntity) updateNodeValue["visibleParticles"] = node.visible
        if (node.visible) {
            // The children need to become visible
            node.childrenIds.forEach(childId => {
                updateNode(childId, {visible: true});
            });
        } else {
            // All the children should become invisible (could be many scopes below)
            // This is very slow
            node.childrenIds.forEach(childId => {
                propagateValue(childId, "visible", false)
            });
        }
        updateNode(id, updateNodeValue);
    }
    
    const handleOnContextMenu = (event) => {
        // Stop the event from bubbling up
        event.stopPropagation();
        //console.log("handleOnContextMenu", "event:", event, "node.visible:", node.visible, "depth:", node.depth);
        updateNode("root", {visible: true});
        const rootNode = getNode("root");
        rootNode.childrenIds.forEach(childId => {
            propagateValue(childId, "visible", false)
        });
    }
    
    return (
        <mesh ref={blobRef}
            onClick={(event) => handleOnClick(event)}
            onContextMenu={(event) => handleOnContextMenu(event)}>
            <meshBasicMaterial color={color} />
        </mesh>
    );
};

export default Blob;
