import React, { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import withAnimationAndPosition from '../withAnimationAndPosition'; // Ensure correct import path

const Camera = React.forwardRef(({ id, animationState, initialState }, ref) => {
    const { camera } = useThree();
    const [isInitialized, setIsInitialized] = useState(false);

    const { zoom = 1, position = [0, 0, 1], duration = 1000 } = animationState;

    // Initialize the camera position directly when component mounts
    useEffect(() => {
        if (initialState && initialState.position) {
            camera.position.set(initialState.position[0], initialState.position[1], initialState.position[2]);
            camera.updateProjectionMatrix();
        }
        if (initialState && initialState.zoom) {
            camera.zoom = initialState.zoom;
            camera.updateProjectionMatrix();
        }
        setIsInitialized(true)
    }, [camera, initialState]);

    useSpring({
        from: {
            zoom: isInitialized ? camera.zoom : initialState.zoom,
            posX: isInitialized ? camera.position.x : initialState.position[0],
            posY: isInitialized ? camera.position.y : initialState.position[1],
            posZ: isInitialized ? camera.position.z : initialState.position[2]
        },
        to: {
            zoom: zoom,
            posX: position[0],
            posY: position[1],
            posZ: position[2]
        },
        config: { duration: duration },
        onChange: ({ value }) => {
            if (isInitialized) {
                camera.zoom = value.zoom;
                camera.position.set(value.posX, value.posY, value.posZ);
                camera.updateProjectionMatrix();
            }
        }
    });

    return null;
});

export default withAnimationAndPosition(Camera);
