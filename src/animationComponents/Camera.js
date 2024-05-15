import React, { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import withAnimationState from '../withAnimationState'; // Ensure correct import path

const Camera = React.forwardRef(({ animationState, initialState }, ref) => {
    const { camera } = useThree();
    const [isInitialized, setIsInitialized] = useState(false);

    const { zoom = 1, position = [0, 0, 1], duration = 1000 } = animationState;
    const initialZoom = initialState?.zoom || camera.zoom;
    const initialPosition = initialState?.position || [camera.position.x, camera.position.y, camera.position.z];

    // Initialize the camera position and zoom directly when the component mounts
    useEffect(() => {
        if (!isInitialized) {
            camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
            camera.zoom = initialZoom;
            camera.updateProjectionMatrix();
            setIsInitialized(true);
        }
    }, [camera, initialZoom, initialPosition, isInitialized]);

    useSpring({
        from: {
            zoom: isInitialized ? camera.zoom : initialZoom,
            posX: isInitialized ? camera.position.x : initialPosition[0],
            posY: isInitialized ? camera.position.y : initialPosition[1],
            posZ: isInitialized ? camera.position.z : initialPosition[2]
        },
        to: {
            zoom,
            posX: position[0],
            posY: position[1],
            posZ: position[2]
        },
        config: { duration },
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

export default withAnimationState(Camera);
