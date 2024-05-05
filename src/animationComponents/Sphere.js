import React from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';
import { motion } from "framer-motion-3d"
import {CustomText } from './';
import * as THREE from 'three'

const Sphere = React.forwardRef(({ id, animationState, initialState, onClick, onPointerOver, onPointerOut, ...props }, ref) => {

    // This animates something that motion does not support
    const { scale = 1, color = 'blue', radius, visible = true, text = null, position } = { ...initialState, ...animationState };

    // Define animation variants
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: animationState.opacity ?? 1.0 }
    };

    // Calculate text position based on initialState position and any offset
    const textPosition = new THREE.Vector3(
        position.x,
        position.y + radius * 1.2, // Adjust Y position to be slightly above whatever it is annotating or positioned at
        position.z
    );

    return (
        <group visible={visible} >
        <CustomText 
            id={`${id}.FatArrow1`} 
            initialState={{
                position: textPosition,
                text: initialState.text,
                scale: 0.5
            }}/>
        <mesh
            {...props}
            ref={ref}
            position={position}
            scale={scale}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            depthWrite={false}
        >
            <sphereGeometry args={[radius, 32, 32]} />
            <motion.meshStandardMaterial
                color={color}
                initialState="visible"
                transparent={true} 
                animate={animationState.variant}
                variants={variants}
                transition={{ duration: animationState.duration || 0 }}
            />
        </mesh>
        </group>
    );
});

// Automatically wrap Sphere with the HOC before export
export default withAnimationAndPosition(Sphere);
