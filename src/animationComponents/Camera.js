import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import withAnimationAndPosition from '../withAnimationAndPosition'; // Ensure correct import path

const Camera = React.forwardRef(({ id, animationState }, ref) => {
    const { camera } = useThree();

    const { zoom = 1, position = [0, 0, 1] } = animationState;

    useEffect(() => {
        camera.position.set(...position);
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
    }, [position, camera]);
    
    return null;
});

export default withAnimationAndPosition(Camera);
