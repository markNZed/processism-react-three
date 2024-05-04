import React from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';
import { motion } from "framer-motion-3d"

const Sphere = React.forwardRef(({ id, initialPosition, animationState, initialRadius, onClick, onPointerOver, onPointerOut, ...props }, ref) => {

    // This animates something that motion does not support
    const { scale = 1, color = 'blue', radius = initialRadius } = animationState;

    // Define animation variants
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1.0 }
    };

    return (
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
    );
});

// Automatically wrap Sphere with the HOC before export
export default withAnimationAndPosition(Sphere);
