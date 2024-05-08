import React from 'react';
import { useThree } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import withAnimationAndPosition from '../withAnimationAndPosition'; // Ensure correct import path

const Camera = React.forwardRef(({ id, animationState }, ref) => {
    const { camera } = useThree();
    const { zoom = 1, position = [0, 0, 1], duration = 1000 } = animationState;

    useSpring({
        from: {
            zoom: camera.zoom,
            posX: camera.position.x,
            posY: camera.position.y,
            posZ: camera.position.z
        },
        to: {
            zoom: zoom,
            posX: position[0],
            posY: position[1],
            posZ: position[2]
        },
        config: { duration: duration },
        onChange: ({ value }) => {
            camera.zoom = value.zoom;
            camera.position.set(value.posX, value.posY, value.posZ);
            camera.updateProjectionMatrix();
        }
    });

    return null;
});

export default withAnimationAndPosition(Camera);
