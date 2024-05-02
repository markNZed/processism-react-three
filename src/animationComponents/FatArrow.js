// FatArrow.js
import React from 'react';
import { animated } from '@react-spring/three';
import withAnimationAndPosition from '../withAnimationAndPosition';
import * as THREE from 'three'

const FatArrow = React.forwardRef(({ position, opacity, color = 'red', headLength = 0.2, headWidth = 0.15, lineWidth = 0.03, margin = 0.6, ...props }, ref) => {
    const direction = new THREE.Vector3().subVectors(props.to, props.from).normalize();
    const adjustedFrom = props.from.clone().add(direction.clone().multiplyScalar(margin));
    const adjustedTo = props.to.clone().sub(direction.clone().multiplyScalar(margin));
    const arrowLineLength = adjustedFrom.distanceTo(adjustedTo);

    const lineGeometry = new THREE.CylinderGeometry(lineWidth, lineWidth, arrowLineLength, 32);
    const coneGeometry = new THREE.ConeGeometry(headWidth, headLength, 32);

    return (
        <group ref={ref} {...props}>
            <animated.mesh
                geometry={lineGeometry}
                position={adjustedFrom.clone().lerp(adjustedTo, 0.5)}
                quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
            >
                <animated.meshBasicMaterial color={color} transparent={true} opacity={opacity} />
            </animated.mesh>
            <animated.mesh
                geometry={coneGeometry}
                position={adjustedTo}
                quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
            >
                <animated.meshBasicMaterial color={color} transparent={true} opacity={opacity} />
            </animated.mesh>
        </group>
    );
});

export default withAnimationAndPosition(FatArrow);
