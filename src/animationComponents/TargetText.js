import { Text as DreiText } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { motion } from "framer-motion-3d";
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import useStore from '../useStore';

import useMonitorPosition from '../hooks/useMonitorPosition';
import withAnimationState from '../withAnimationState';


const MotionText = motion(DreiText);

// @ts-check

const variants = {
    hidden: { opacity: 0 },
    fadeIn: { opacity: 1, transition: { duration: .5 } },
    fadeOut: { opacity: 0, transition: { duration: .5 } },
    visible: { opacity: 1, }
};
const defaultVariant = "visible";

const TargetText = React.forwardRef(({ targetId, offset, id, animationState, ...props }, ref) => {
    const { text, color = 'black', scale = 1, visible = true } = animationState;

    // We need textRef because we modify the ref in useFrame and cannot modify ref from parent
    const textRef = useRef();

    const { camera } = useThree();  // Access the camera from the R3F context

    // Define motion variants

    const [positions, setPositions] = useState({});


    const updatePositions = (id, position) => {
        setPositions(prev => ({ ...prev, [id]: position }));
    };

    const getComponentRef = useStore(state => state.getComponentRef);
    const targetRef = getComponentRef(targetId);
    useMonitorPosition(targetRef, updatePositions, 'target');

    useEffect(() => {
        if (positions.target) {
            const newTargetPosition = positions.target.clone().add(offset);
            textRef.current.position.copy(newTargetPosition);
        }
    }, [positions, offset]);

    // Verify position is not undefined
    // const isValidPosition = position && 'x' in position && 'y' in position && 'z' in position;

    // Use Frame hook to update text orientation to always face the camera
    useFrame((state) => {
        if (textRef.current) {
            textRef.current.quaternion.copy(camera.quaternion);
        }
    });

    // This will expose textRef as ref to the parent component
    useImperativeHandle(ref, () => textRef.current);

    return text ? (
        <MotionText
            {...props}
            ref={textRef}
            color={color}
            visible={visible}
            anchorX="center"
            anchorY="middle"
            scale={[scale, scale, scale]}
            animate={animationState.variant || defaultVariant }
            variants={variants}
            transition={{ duration: animationState.duration || 0 }}
        >
            {text}
            <motion.meshBasicMaterial
                transparent side={THREE.DoubleSide}
                initialState={defaultVariant}
                animate={animationState.variant || defaultVariant }
                variants={variants}
                transition={{ duration: animationState.duration || 0 }}
                color={color}
            />
        </MotionText>
    ) : null;
});

// Wrap CustomText with the HOC before export
export default withAnimationState(TargetText);
