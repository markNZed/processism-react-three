import React, { useEffect } from 'react';
import withAnimationState from '../withAnimationState';
import * as THREE from 'three';
import { motion } from "framer-motion-3d"

const Circle = React.forwardRef(({id, animationState, ...props}, ref) => {

    // This animates something that motion does not support
    const { radius, visible = true, position, color = "rgb(0, 128, 0)" } = animationState;

    // Define animation variants
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: animationState.opacity ?? 1.0 }
    };
    const defaultVariant = "visible";

    // Component state machine using animationState.variant as the state
    useEffect(() => {
        switch (animationState.variant) {
            default:
              break;
          }
    }, [animationState.variant]);

    // Cylinder to simulate a circle with thickness
    const cylinderHeight = 0.1; // This is the "thickness" of the circle
    const radialSegments = 32; // This can be adjusted for smoother circles

    // Circle component now only responsible for setting up its geometry and material.
    // All animations and dynamic property updates are handled by HOC via props.
    return (
        <mesh
            {...props}
            ref={ref}
            position={position}
            depthWrite={false}
            visible={visible}
            rotation={[Math.PI / 2, 0, 0]} // Rotate the cylinder to align it as a circle in the xz-plane
        >
            <cylinderGeometry
                args={[radius, radius, cylinderHeight, radialSegments]}
                attach="geometry"
            />
            <motion.meshBasicMaterial 
              transparent 
              side={THREE.DoubleSide} 
              initialState={defaultVariant}
              animate={animationState.variant || defaultVariant}
              variants={variants}
              transition={{ duration: animationState.duration || 0 }}
              color={color}
            />
        </mesh>
    );
});

// Wrap Circle with the HOC to inject position, scale, and any other animations.
export default withAnimationState(Circle);
