import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import useStore from '../useStore';
import { DoubleArrow } from './';
import withAnimationAndPosition from '../withAnimationAndPosition';
import * as THREE from 'three';

const DynamicDoubleArrow = React.forwardRef(({ id, animationState, ...props }, ref) => {
    const { fromId, toId } = animationState;
    const { components } = useStore(state => ({ components: state.components }));
    const fromIdPosition = useStore(state => state.positions[fromId]);
    const toIdPosition = useStore(state => state.positions[toId]);
    const { updateAnimationState } = useStore();
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

    const getEdgePosition = (componentId, targetPosition) => {
        let componentRef = components[componentId]?.current;
        if (componentRef) {
            if (componentRef.userData && componentRef.userData.meshId) {
                const meshRef = components[componentRef.userData.meshId]?.current;
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

    useEffect(() => {
        if (fromIdPosition 
            && toIdPosition 
            && localRef.current 
            && (!vectorsAreClose(fromIdPosition, lastFrom) || !vectorsAreClose(toIdPosition, lastTo))
        ) {
            // Should compare positions to reduce renders
            const newFromPosition = getEdgePosition(fromId, toIdPosition);
            const newToPosition = getEdgePosition(toId, fromIdPosition);
            setEnds({ from: newFromPosition, to: newToPosition });
            setLastTo(toIdPosition)
            setLastFrom(fromIdPosition)
            //console.log("DynamicDoubleArrow", id, fromIdPosition, toIdPosition, ends.from, ends.to)
        }
    }, [fromIdPosition, toIdPosition]);

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
