import React, { useState, useEffect } from 'react';
import useStore from '../useStore';
import { DoubleArrow } from './';
import withAnimationAndPosition from '../withAnimationAndPosition';
import * as THREE from 'three';

const DynamicDoubleArrow = React.forwardRef(({ id, animationState, ...props }, ref) => {
    const { fromId, toId } = animationState;
    const { components } = useStore(state => ({ components: state.components }));
    const { positions } = useStore(state => ({ positions: state.positions }));

    // State to keep track of positions
    const [fromPosition, setFromPosition] = useState(null);
    const [toPosition, setToPosition] = useState(null);

    const getMeshPosition = (componentId) => {
        let componentRef = components[componentId]?.current;
        if (componentRef) {
            if (componentRef.userData && componentRef.userData.meshId) {
                // If there's a userData.meshId, we try to get that specific mesh
                componentRef = components[componentRef.userData.meshId]?.current || componentRef;
            }
            // Use matrixWorld to get the absolute world position
            let worldPosition = new THREE.Vector3();
            worldPosition.setFromMatrixPosition(componentRef.matrixWorld);
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
        const parentId = getParentId(id)
        if (parentId) {
            let parentRef = components[parentId]?.current;
            if (parentRef) {
                // Assuming the parent's world position needs to be obtained to make coordinates relative
                let parentPos = new THREE.Vector3().setFromMatrixPosition(parentRef.matrixWorld);
                // Transform nearestPoint to coordinates relative to the parent
                if (nearestPoint) {
                    // Subtract the parent's world position from the nearest point's world position
                    nearestPoint.sub(parentPos);
                }
            }
        }
        return nearestPoint;
    };

    useEffect(() => {
        const fromMeshPosition = getMeshPosition(fromId);
        const toMeshPosition = getMeshPosition(toId);

        if (fromMeshPosition && toMeshPosition) {
            const newFromPosition = getEdgePosition(fromId, toMeshPosition);
            const newToPosition = getEdgePosition(toId, fromMeshPosition);
            setFromPosition(newFromPosition);
            setToPosition(newToPosition);
        }
    }, [fromId, toId, components]);

    // Ensure both positions are available before rendering the arrow
    if (!fromPosition || !toPosition) return null;

    return (
        <group ref={ref}>
            <DoubleArrow
                {...props}
                id={`${id}.DoubleArrow`}
                initialState={{
                    ...animationState,
                    from: fromPosition,
                    to: toPosition,
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