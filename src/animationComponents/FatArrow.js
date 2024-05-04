// FatArrow.js
import React from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';
import * as THREE from 'three'
import { motion } from "framer-motion-3d"

const FatArrow = React.forwardRef(({ id, animationState, margin = 0, ...props }, ref) => {

    // This animates something that motion does not support
    const { color = 'red', headLength = 0.2, headWidth = 0.15, lineWidth = 0.05, visible = true } = animationState;

    const direction = new THREE.Vector3().subVectors(props.to, props.from).normalize();
    const adjustedFrom = props.from.clone().add(direction.clone().multiplyScalar(margin));
    const adjustedTo = props.to.clone().sub(direction.clone().multiplyScalar(margin));
    const arrowLineLength = adjustedFrom.distanceTo(adjustedTo);

    const lineGeometry = new THREE.CylinderGeometry(lineWidth, lineWidth, arrowLineLength, 32);
    const coneGeometry = new THREE.ConeGeometry(headWidth, headLength, 32);

    // Define animation variants
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: animationState.opacity ?? 1.0 }
    };

    return (
        <group ref={ref} {...props} visible={visible}>
            <mesh
                geometry={lineGeometry}
                position={adjustedFrom.clone().lerp(adjustedTo, 0.5)}
                quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
            >
                <motion.meshBasicMaterial
                    color={color} 
                    transparent={true} 
                    initial="visible"
                    animate={animationState.variant}
                    variants={variants}
                    transition={{ duration: animationState.duration || 0 }}
                />
            </mesh>
            <mesh
                geometry={coneGeometry}
                position={adjustedTo}
                quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
            >
                <motion.meshBasicMaterial 
                    color={color} 
                    transparent={true} 
                    initial="visible"
                    animate={animationState.variant}
                    variants={variants}
                    transition={{ duration: animationState.duration || 0 }}
                />
            </mesh>
        </group>
    );
});

export default withAnimationAndPosition(FatArrow);
