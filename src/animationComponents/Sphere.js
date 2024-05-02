import React from 'react';
import { animated } from '@react-spring/three';
import withAnimationAndPosition from '../withAnimationAndPosition'; // Ensure correct path

const Sphere = React.forwardRef(({ position, opacity, scale, onClick, onPointerOver, onPointerOut, color = 'blue', radius = 0.5, ...props }, ref) => {
    return (
        <animated.mesh
            {...props}
            ref={ref}
            position={position}
            scale={scale}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            material-opacity={opacity}
            depthWrite={false}
        >
            <sphereGeometry args={[radius, 32, 32]} />
            <animated.meshStandardMaterial color={color} opacity={opacity} transparent />
        </animated.mesh>
    );
});

// Automatically wrap Sphere with the HOC before export
export default withAnimationAndPosition(Sphere);
