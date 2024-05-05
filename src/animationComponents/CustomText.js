import React, { useRef, useEffect } from 'react';
import { Text as DreiText } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { motion } from "framer-motion-3d"
import withAnimationAndPosition from '../withAnimationAndPosition';

const MotionText = motion(DreiText);

const CustomText = React.forwardRef(({ id, animationState, initialState, ...props }, ref) => {
    const { text, color = 'black', scale = 1, visible = true, position } = { ...initialState, ...animationState };

    const textRef = useRef();  // Ref for the text
    const { camera } = useThree();  // Access the camera from the R3F context

    // Define motion variants
    const variants = {
        hidden: { opacity: 0, scale: 0.5 },
        visible: { opacity: 1, scale: 1 }
    };
    
    // Verify position is not undefined
    const isValidPosition = position && 'x' in position && 'y' in position && 'z' in position;

    // Use Frame hook to update text orientation to always face the camera
    useFrame(() => {
        if (textRef.current && isValidPosition) {
            textRef.current.quaternion.copy(camera.quaternion);
        }
    });

    return isValidPosition && text ? (
        <MotionText
            ref={textRef}
            color={color}
            visible={visible}
            anchorX="center"
            anchorY="middle"
            position={position}
            scale={[scale, scale, scale]}
            {...props}
            animate={animationState.variant}
            variants={variants}
            transition={{ duration: animationState.duration || 0 }}
        >
            {text}
        </MotionText>
    ) : null;
});

// Wrap CustomText with the HOC before export
export default withAnimationAndPosition(CustomText);
