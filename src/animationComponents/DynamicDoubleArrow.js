import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import useStore from '../useStore';
import { DoubleArrow } from './';
import withAnimationAndPosition from '../withAnimationAndPosition';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const DynamicDoubleArrow = React.forwardRef(({ id, animationState, ...props }, ref) => {
    const { fromId, toId } = animationState;
    const getComponentRef = useStore(state => state.getComponentRef);
    const localRef = useRef(); // So we can write to the ref
    useImperativeHandle(ref, () => localRef.current);
    const [lastFrom, setLastFrom] = useState();
    const [lastTo, setLastTo] = useState();

    // State to keep track of ends
    const [ends, setEnds] = useState({ from: null, to: null });

    function vectorsAreClose(v1, v2, epsilon = 0.0001) {
        if (!v1 || !v2) {
            return false;
        }
        const diff = v1.clone().sub(v2);
        return diff.lengthSq() < epsilon * epsilon; // Comparing squared values avoids a sqrt
    }

    const getEdgePosition = (componentRef, targetPosition) => {
        if (componentRef.current) {
            if (componentRef?.current?.userData?.meshId) {
                const meshRef = getComponentRef(componentRef.current.userData.meshId);
                componentRef = meshRef;
            }
            let nearestPoint = calculateNearestPoint(componentRef, targetPosition);
            const localPosition = new THREE.Vector3();
            // Convert world position to local position
            localRef.current.worldToLocal(localPosition.copy(nearestPoint));
            //console.log("DynamicDoubleArrow nearestPoint", id, nearestPoint, localPosition)
            return localPosition
        } else {
            console.log("Problem with ref", id, componentRef);
            return null
        }
    };

    // Note this is not dynamic when position changes
    useFrame(() => {
        const fromRef = getComponentRef(fromId);
        const toRef = getComponentRef(toId);
        if (fromRef && toRef) {
            // Vector to hold the world position
            const fromWorldPosition = new THREE.Vector3();
            // Calculate world position
            fromRef.current.updateMatrixWorld();
            fromRef.current.getWorldPosition(fromWorldPosition);
            // Vector to hold the world position
            const toWorldPosition = new THREE.Vector3();
            // Calculate world position
            toRef.current.updateMatrixWorld();
            toRef.current.getWorldPosition(toWorldPosition);
            if (fromWorldPosition 
                && toWorldPosition 
                && localRef.current 
                && (!vectorsAreClose(fromWorldPosition, lastFrom) || !vectorsAreClose(toWorldPosition, lastTo))
            ) {
                const newFromPosition = getEdgePosition(getComponentRef(fromId), toWorldPosition);
                const newToPosition = getEdgePosition(getComponentRef(toId), fromWorldPosition);
                setEnds({ from: newFromPosition, to: newToPosition });
                setLastTo(toWorldPosition)
                setLastFrom(fromWorldPosition)
                //console.log("DynamicDoubleArrow", id, fromIdPosition, toIdPosition, ends.from, ends.to)
            }
        }
    });

    return (
        <group ref={localRef}>
            {ends.from && ends.to && (
                <DoubleArrow
                    {...props}
                    id={`${id}.DoubleArrow`}
                    initialState={{
                        ...animationState,
                        from: ends.from,
                        to: ends.to,
                    }}
                    animationState={{
                        ...animationState,
                        from: ends.from,
                        to: ends.to,
                    }}
                />
            )}
        </group>
    );
});

export default withAnimationAndPosition(DynamicDoubleArrow);

// Helper functions

function calculateNearestPoint(meshRef, targetPosition) {
    const vertices = meshRef.current.geometry.attributes.position;
    let minDistance = Infinity;
    let nearestPoint = null;
    
    for (let i = 0; i < vertices.count; i++) {
        let vertex = new THREE.Vector3(
            vertices.getX(i),
            vertices.getY(i),
            vertices.getZ(i)
        ).applyMatrix4(meshRef.current.matrixWorld);
        
        const distance = vertex.distanceTo(targetPosition);
        if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = vertex;
        }
    }
    return nearestPoint;
}
