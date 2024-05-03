import React from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition'; // Ensure correct path
import * as THREE from 'three';
import { motion } from "framer-motion-3d"

const Circle = React.forwardRef(({id, initialPosition, animationState, ...props}, ref) => {

    // This animates something that motion does not support
    const { radius = 3.5 } = animationState;

    // Define animation variants
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 0.5, color: "rgb(0, 128, 0)" }
    };

    // JSON.parse(JSON.stringify())
    console.log("Circle", JSON.stringify(animationState));

    // Circle component now only responsible for setting up its geometry and material.
    // All animations and dynamic property updates are handled by HOC via props.
    return (
        <mesh
            {...props}
            ref={ref}
            position={initialPosition}
            depthWrite={false}
        >
            <circleGeometry args={[radius, 32]} />
            <motion.meshBasicMaterial 
              transparent side={THREE.DoubleSide} 
              initial="hidden"
              animate={animationState.variant}
              variants={variants}
              transition={{ duration: animationState.duration || 0 }}
            />
        </mesh>
    );
});

// Wrap Circle with the HOC to inject position, scale, and any other animations.
export default withAnimationAndPosition(Circle);
