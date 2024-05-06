import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import withAnimationAndPosition from '../withAnimationAndPosition'; // Ensure correct import path

const Camera = React.forwardRef(({ id, animationState }, ref) => {
    const { camera } = useThree();
    const targetZoom = useRef(camera.zoom);
    const targetPosition = useRef(new Vector3(...camera.position.toArray()));

    const { zoom = 1, position = [0, 0, 1] } = animationState;

    useEffect(() => {
        targetZoom.current = zoom;
        targetPosition.current.set(...position);
    }, [zoom, position]);

    useFrame(() => {
        // Smoothly interpolate the camera's zoom
        if (camera.zoom !== targetZoom.current) {
            camera.zoom += (targetZoom.current - camera.zoom) * 0.01;
            camera.updateProjectionMatrix();
        }
        // Smoothly interpolate the camera's position
        camera.position.lerp(targetPosition.current, 0.01);
    });

    return null;
});

export default withAnimationAndPosition(Camera);
