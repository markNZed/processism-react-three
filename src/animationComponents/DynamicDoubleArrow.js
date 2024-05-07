import React, { useState, useEffect } from 'react';
import useStore from '../useStore';
import { DoubleArrow } from './';
import withAnimationAndPosition from '../withAnimationAndPosition';
import * as THREE from 'three';

const DynamicDoubleArrow = React.forwardRef(({ id, animationState, ...props }, ref) => {
    const { fromId, toId } = animationState;
    const { components } = useStore(state => ({ components: state.components }));

    // State to keep track of ends
    const [ends, setEnds] = useState({ from: null, to: null });

    const getMeshPosition = (componentId) => {
        const componentRef = components[componentId]?.current;
        if (componentRef) {
            // Access userData and meshId to find the specific mesh
            const meshId = componentRef.userData?.meshId;
            const finalRef = meshId && components[meshId]?.current || componentRef;
            // Use matrixWorld to get the absolute world position
            const worldPosition = new THREE.Vector3();
            worldPosition.setFromMatrixPosition(finalRef.matrixWorld);
            return worldPosition;
        }
        return null;
    };

    const getEdgePosition = (componentId, targetPosition) => {
        let componentRef = components[componentId]?.current;
        if (componentRef && componentRef.userData && componentRef.userData.meshId) {
            const meshRef = components[componentRef.userData.meshId]?.current;
            componentRef = meshRef;
        }
        let nearestPoint = calculateNearestPoint(componentRef, targetPosition);
        // Transform world coordinates to local coordinates relative to the parent
        const parentPosition = getParentPosition(id);
        return nearestPoint.sub(parentPosition); // Transform to parent-relative coordinates
    };

    const getParentPosition = (childId) => {
        const parentId = getParentId(childId);
        if (parentId) {
            const parentRef = components[parentId]?.current;
            return parentRef ? new THREE.Vector3().setFromMatrixPosition(parentRef.matrixWorld) : new THREE.Vector3();
        }
        return new THREE.Vector3(); // Return default position if no parent
    };

    useEffect(() => {
        const fromMeshPosition = getMeshPosition(fromId);
        const toMeshPosition = getMeshPosition(toId);

        if (fromMeshPosition && toMeshPosition) {
            const newFromPosition = getEdgePosition(fromId, toMeshPosition);
            const newToPosition = getEdgePosition(toId, fromMeshPosition);
            setEnds({ from: newFromPosition, to: newToPosition });
        }
    }, [fromId, toId, components]);

    // Ensure both ends are available before rendering the arrow
    if (!ends.from || !ends.to) return null;

    return (
        <group ref={ref}>
            <DoubleArrow
                {...props}
                id={`${id}.DoubleArrow`}
                initialState={{
                    ...animationState,
                    from: ends.from,
                    to: ends.to,
                }}
            />
        </group>
    );
});

export default withAnimationAndPosition(DynamicDoubleArrow);

// Helper functions

function calculateNearestPoint(mesh, targetPosition) {
    const vertices = mesh.geometry.attributes.position;
    let minDistance = Infinity;
    let nearestPoint = null;
    
    for (let i = 0; i < vertices.count; i++) {
        let vertex = new THREE.Vector3(
            vertices.getX(i),
            vertices.getY(i),
            vertices.getZ(i)
        ).applyMatrix4(mesh.matrixWorld);
        
        const distance = vertex.distanceTo(targetPosition);
        if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = vertex;
        }
    }
    return nearestPoint;
}

function getParentId(childId) {
    const parts = childId.split('.');
    parts.pop(); // Remove the last element which is the childID part
    return parts.join('.'); // Re-join the remaining parts to form the parentID
}