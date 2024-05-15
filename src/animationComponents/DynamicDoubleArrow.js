import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import useStore from '../useStore';
import { DoubleArrow } from './';
import withAnimationState from '../withAnimationState';
import * as THREE from 'three';
import useMonitorPosition from '../hooks/useMonitorPosition';

const DynamicDoubleArrow = React.forwardRef(({ id, animationState, initialState, ...props }, ref) => {
    const { fromId, toId } = animationState;
    const getComponentRef = useStore(state => state.getComponentRef);
    const localRef = useRef(); // So we can write to the ref
    useImperativeHandle(ref, () => localRef.current);
    const [positions, setPositions] = useState({});

    const updatePositions = (id, position) => {
        setPositions(prev => ({ ...prev, [id]: position }));
    };

    const fromRef = getComponentRef(fromId);
    const toRef = getComponentRef(toId);
    useMonitorPosition(fromRef, updatePositions, 'from');
    useMonitorPosition(toRef, updatePositions, 'to');

    // State to keep track of ends
    const [ends, setEnds] = useState({ from: null, to: null });

    const getEdgePosition = (componentRef, targetPosition) => {
        if (componentRef?.current) {
            if (componentRef?.current?.userData?.meshId) {
                const meshRef = getComponentRef(componentRef.current.userData.meshId);
                componentRef = meshRef;
            }
            let nearestPoint = calculateNearestPoint(componentRef, targetPosition);
            if (nearestPoint) {
                const localPosition = new THREE.Vector3();
                // Convert world position to local position
                localRef.current.worldToLocal(localPosition.copy(nearestPoint));
                //console.log("DynamicDoubleArrow nearestPoint", id, nearestPoint, localPosition)
                return localPosition
            } else {
                console.log("Problem with nearestPoint", id, nearestPoint);
                return null;
            }
        } else {
            console.log("Problem with ref", id, componentRef);
            return null;
        }
    };

    useEffect(() => {
        if (positions.from && positions.to) {
            const newFromPosition = getEdgePosition(getComponentRef(fromId), positions.to);
            const newToPosition = getEdgePosition(getComponentRef(toId), positions.from);
            setEnds({ from: newFromPosition, to: newToPosition });
        }
    }, [positions]);

    return (
        <group ref={localRef}>
            {ends.from && ends.to && (
                <DoubleArrow
                    {...props}
                    id={`${id}.DoubleArrow`}
                    initialState={{
                        ...initialState,
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

export default withAnimationState(DynamicDoubleArrow);

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
