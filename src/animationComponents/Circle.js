// Circle.js
import React from 'react';
import { a, animated } from '@react-spring/three';
import withAnimationAndPosition from '../withAnimationAndPosition'; // Ensure correct path
import * as THREE from 'three'

const Circle = React.forwardRef(({ position, opacity, scale, color = 'green', radius = 3.5, ...props }, ref) => {
    return (
        <a.mesh
            {...props}
            ref={ref}
            position={position}
            scale={scale}
            material-opacity={opacity}
            depthWrite={false}
        >
            <circleGeometry args={[radius, 32]} />
            <animated.meshBasicMaterial color={color} opacity={opacity} transparent side={THREE.DoubleSide} />
        </a.mesh>
    );
});

export default withAnimationAndPosition(Circle);
