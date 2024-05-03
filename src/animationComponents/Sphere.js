import React from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';

const Sphere = React.forwardRef(({ id, initialPosition, opacity, scale, onClick, onPointerOver, onPointerOut, color = 'blue', radius = 0.5, ...props }, ref) => {
    return (
        <mesh
            {...props}
            ref={ref}
            position={initialPosition}
            scale={scale}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            material-opacity={opacity}
            depthWrite={false}
        >
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial color={color} opacity={opacity} transparent />
        </mesh>
    );
});

// Automatically wrap Sphere with the HOC before export
export default withAnimationAndPosition(Sphere);
