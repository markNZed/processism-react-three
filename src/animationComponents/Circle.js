// Circle.js
import React from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition'; // Ensure correct path
import * as THREE from 'three'

const Circle = React.forwardRef(({ id, initialPosition, opacity, scale, color = 'green', radius = 3.5, ...props }, ref) => {

    return (
        <mesh
            {...props}
            ref={ref}
            position={initialPosition}
            scale={scale}
            material-opacity={opacity}
            depthWrite={false}
        >
            <circleGeometry args={[radius, 32]} />
            <meshBasicMaterial color={color} opacity={opacity} transparent side={THREE.DoubleSide} />
        </mesh>
    );
});

export default withAnimationAndPosition(Circle);
