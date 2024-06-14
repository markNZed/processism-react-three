import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Blob = ({ id, blobRef, blobData, blobVisibleRef, indexArray, scope, flattenedParticleRefs, chainRef, lastCompoundEntity, worldToLocalFn, color, jointScopeRef }) => {
    const indexArrayStr = indexArray.join();
    const prevParentVisibleRef = useRef(true);
    const worldVector = new THREE.Vector3();

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
                // Check it is a link on this scope
                const linkedIndexes = chainRef.current[idx];
                let onChain = true;
                onChain = false;
                // If the joint was not created at this scope then skip
                for (let j = 0; j < linkedIndexes.length; j++) {
                    const jointIndex = `${idx}-${linkedIndexes[j]}`;
                    const jointScope = jointScopeRef.current[jointIndex];
                    if (scope === jointScope) {
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
                middleIndexes.push(indexes[midIndex]);
            }
        }
        // Calculate the middle position between the first and last link with wraparound
        const firstJoint = jointIndexes[0];
        const lastJoint = jointIndexes[jointIndexes.length - 1];
        const indexesLength = indexes.length;
        const distance = (indexesLength - lastJoint + firstJoint);
        const middle = (lastJoint + Math.floor(distance / 2)) % indexes.length;
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
        for (let i = 0; i < flattenedParticleRefs.current.length; ++i) {
            const scopeOuter = flattenedParticleRefs.current[i].current.userData.scopeOuter;
            let outer = scopeOuter[scope];
            if (outer) {
                for (let j = Object.keys(scopeOuter).length - 1;j > scope; j--) {
                    if (!scopeOuter[j.toString()]) {
                        outer = false;
                        break;
                    }
                }
            }
            if (outer) {
                const uniqueIndex = flattenedParticleRefs.current[i].current.userData.uniqueIndex;
                blobOuterUniqueIndexes.push(uniqueIndex);
                flattenedIndexes.push(i);
            }
        }

        if (!blobOuterUniqueIndexes.length) {
            console.error("blobOuterUniqueIndexes is empty!", id, flattenedParticleRefs.current.length);
        }

        let blobIndexes;
        if (lastCompoundEntity) {
            blobIndexes = blobOuterUniqueIndexes;
        } else {
            const orderedIndexes = buildOrderedIndexes(chainRef, blobOuterUniqueIndexes);
            if (!orderedIndexes.length) console.error("orderedIndexes is empty!", id);
            blobIndexes = filterMiddleIndexes(chainRef, orderedIndexes);
        }

        for (let i = 0; i < blobIndexes.length; ++i) {
            blobData.current.positions.push(new THREE.Vector3());
            const indexInOuter = blobOuterUniqueIndexes.indexOf(blobIndexes[i]);
            const flattenedIndex = flattenedIndexes[indexInOuter];
            blobData.current.flattenedIndexes.push(flattenedIndex);
        }

        blobVisibleRef.current[indexArrayStr] = (scope == 0);

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

        let ancestorVisible = false;
        let parentVisible = false;
        const parentScope = scope - 1;
        for (let i = parentScope; i >= 0; i--) {
            const key = indexArray.slice(0, i).join(); // create a string for the key
            if (blobVisibleRef.current[key]) {
                blobVisibleRef.current[indexArrayStr] = false;
                ancestorVisible = true;
                if (i == parentScope) parentVisible = true;
                break;
            }
        }

        // Special case to look after particles where visibility is managed from the parent ComponentEntity
        // to avoid needing to have blob related functionality in teh Particle component
        if (lastCompoundEntity && ancestorVisible) blobVisibleRef.current[indexArrayStr + ',0'] = false;

        const parentVanished = !parentVisible && prevParentVisibleRef.current;
        if (parentVanished) {
            blobVisibleRef.current[indexArrayStr] = true;
        }
        prevParentVisibleRef.current = parentVisible;

        if (lastCompoundEntity) {
            for (let i = 0; i < flattenedParticleRefs.current.length; i++) {
                flattenedParticleRefs.current[i].current.userData.visible = blobVisibleRef.current[indexArrayStr + ',0'];
            }
        }

        if (!ancestorVisible && blobVisibleRef.current[indexArrayStr]) {

            const blobPoints = blobData.current.positions.map((positiion, i) => {
                const flattenedIndex = blobData.current.flattenedIndexes[i]
                const pos = flattenedParticleRefs.current[flattenedIndex].current.translation();
                worldVector.set(pos.x, pos.y, pos.z);
                positiion.copy(worldToLocalFn(worldVector))
                return positiion;
            });

            const geometry = points_to_geometry(blobPoints);
            blobRef.current.geometry.dispose();
            blobRef.current.geometry = geometry;
            blobRef.current.visible = blobVisibleRef.current[indexArrayStr];

        } else {
            blobRef.current.visible = false;
        }

    });

    const handleOnClick = (event) => {
        console.log("handleOnClick", "event:", event, "blobVisibleRef.current:", blobVisibleRef.current, "scope:", scope)
        // If a higher blob is visible then ignore
        for (let i = scope - 1; i >= 0; i--) {
            const key = indexArray.slice(0, i).join(); // create a string for the key
            if (blobVisibleRef.current[key]) {
                return
            }
        }
        // Stop the event from bubbling up
        event.stopPropagation();
        // Alternate visibility
        blobVisibleRef.current[indexArrayStr] = !blobVisibleRef.current[indexArrayStr];
        //Special case for Particles
        if (lastCompoundEntity) {
            blobVisibleRef.current[indexArrayStr + ',0'] = !blobVisibleRef.current[indexArrayStr];
        }
    }
    
    const handleOnContextMenu = (event, blobVisibleRef, scope) => {
        // Stop the event from bubbling up
        event.stopPropagation();
        console.log("handleOnContextMenu", "event:", event, "blobVisibleRef.current:", blobVisibleRef.current, "scope:", scope);
        // The largest blob has an empty key
        blobVisibleRef.current[''] = true;
    }
    

    return (
        <mesh ref={blobRef}
            onClick={(event) => handleOnClick(event)}
            onContextMenu={(event) => handleOnContextMenu(event, blobVisibleRef)}>
            <meshBasicMaterial color={color} />
        </mesh>
    );
};

export default Blob;
