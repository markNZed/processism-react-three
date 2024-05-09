import React, { useRef, useEffect } from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition'; 
import * as THREE from 'three';

const FatArrow = React.forwardRef(({ id, animationState, ...props }, ref) => {
    const { color = 'red', headLength = 0.2, headWidth = 0.15, lineWidth = 0.05, visible = true, margin = 0, from, to } = animationState;

    const lineMesh = useRef(null);
    const coneMesh = useRef(null);

    useEffect(() => {
        if (lineMesh.current && coneMesh.current) {
            //console.log("FatArrow", from, to)
            const direction = new THREE.Vector3().subVectors(to, from).normalize();
            const adjustedFrom = from.clone().add(direction.clone().multiplyScalar(margin));
            const adjustedTo = to.clone().sub(direction.clone().multiplyScalar(margin));
            const arrowLineLength = adjustedFrom.distanceTo(adjustedTo);

            // Update line geometry
            const lineGeometry = new THREE.CylinderGeometry(lineWidth, lineWidth, arrowLineLength, 32);
            lineMesh.current.geometry.dispose(); // Dispose old geometry
            lineMesh.current.geometry = lineGeometry;

            // Positioning logic remains the same
            lineMesh.current.position.copy(adjustedFrom.clone().lerp(adjustedTo, 0.5));
            lineMesh.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

            // For the cone
            const coneGeometry = new THREE.ConeGeometry(headWidth, headLength, 32);
            coneMesh.current.geometry.dispose();
            coneMesh.current.geometry = coneGeometry;
            coneMesh.current.position.copy(adjustedTo);
            coneMesh.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        }
    }, [from, to, margin, lineWidth, headWidth, headLength]); // Dependency array includes all props affecting geometry

    return (
        <group ref={ref} visible={visible}>
            <mesh ref={lineMesh}>
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh ref={coneMesh}>
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    );
});

export default withAnimationAndPosition(FatArrow);
