import React, { useRef } from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';
import { motion } from "framer-motion-3d"
import { Text } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three'

const Sphere = React.forwardRef(({ id, initialPosition, animationState, initialRadius, onClick, onPointerOver, onPointerOut, ...props }, ref) => {

    const textRef = useRef();  // Ref for the text

    // This animates something that motion does not support
    const { scale = 1, color = 'blue', radius = initialRadius, visible = true } = animationState;

    // Define animation variants
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: animationState.opacity ?? 1.0 }
    };

    // Calculate text position above the sphere
    const textPosition = [
        initialPosition.x,  // x position remains the same as the sphere
        initialPosition.y + radius * scale + 0.2, // y position is above the sphere, add a small offset to avoid z-fighting
        initialPosition.z  // z position remains the same as the sphere
    ];

    const { camera } = useThree();  // Access the camera from the R3F context

    useFrame(() => {
        if (textRef.current) {
            textRef.current.quaternion.copy(camera.quaternion);  // Make text face the camera each frame
        }
    });

    return (
        <group visible={visible} >
        <Text ref={textRef} color="black" anchorX="center" anchorY="middle" position={textPosition} scale={0.5} >
        Sphere
        </Text>
        <mesh
            {...props}
            ref={ref}
            position={initialPosition}
            scale={scale}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            depthWrite={false}
        >
            <sphereGeometry args={[radius, 32, 32]} />
            <motion.meshStandardMaterial
                color={color}
                initial="visible"
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
