import { Text as DreiText } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { motion } from "framer-motion-3d";
import React, { useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

import withAnimationState from '../withAnimationState';

const MotionText = motion(DreiText);

const CustomText = React.forwardRef(({ id, animationState, ...props }, ref) => {
    const { text, color = 'black', scale = 1, visible = true, position } = animationState;

    // We need textRef because we modify the ref in useFrame and cannot modify ref from parent
    const textRef = useRef();

    const { camera } = useThree();  // Access the camera from the R3F context

    // Define motion variants
    const variants = {
        hidden: { opacity: 0, },
        visible: { opacity: 1, }
    };

    // Verify position is not undefined
    const isValidPosition = position && 'x' in position && 'y' in position && 'z' in position;

    // Use Frame hook to update text orientation to always face the camera
    useFrame(() => {
        if (textRef.current && isValidPosition) {
            textRef.current.quaternion.copy(camera.quaternion);
        }
    });

    // This will expose textRef as ref to the parent component
    useImperativeHandle(ref, () => textRef.current);

    return isValidPosition && text ? (
        <MotionText
            {...props}
            ref={textRef}
            color={color}
            visible={visible}
            anchorX="center"
            anchorY="middle"
            position={position}
            scale={[scale, scale, scale]}
            animate={animationState.variant}
            variants={variants}
            transition={{ duration: animationState.duration || 0 }}
        >
            {text}
            <motion.meshBasicMaterial
                transparent side={THREE.DoubleSide}
                initialState="visble"
                animate={animationState.variant}
                variants={variants}
                transition={{ duration: animationState.duration || 0 }}
                color={color}
            />
        </MotionText>
    ) : null;
});

// Wrap CustomText with the HOC before export
export default withAnimationState(CustomText);
