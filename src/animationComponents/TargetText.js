import { Text as DreiText } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { motion } from "framer-motion-3d";
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import useAppStore from '../useAppStore';
import useMonitorPosition from '../hooks/useMonitorPosition';
import withAnimationState from '../withAnimationState';

const MotionText = motion(DreiText);

// @ts-check

const variants = {
    hidden: { opacity: 0 },
    fadeIn: { opacity: 1, transition: { duration: 0.5 } },
    fadeOut: { opacity: 0, transition: { duration: 0.5 } },
    visible: { opacity: 1 }
};
const defaultVariant = "visible";

const TargetText = React.forwardRef(({ id, targetId, offset = new THREE.Vector3(), animationState, ...props }, ref) => {
    const { text, color = 'black', scale = 1, visible = true, position } = animationState;

    const textRef = useRef();
    const { camera } = useThree();
    const [positions, setPositions] = useState({});
    
    const getComponentRef = useAppStore((state) => state.getComponentRef);
    const targetRef = getComponentRef(targetId);

    const updatePositions = (id, position) => {
        setPositions((prev) => ({ ...prev, [id]: position }));
    };

    useMonitorPosition(targetRef, updatePositions, targetId);

    useEffect(() => {
        if (targetId && positions[targetId]) {
            const newTargetPosition = positions[targetId].clone().add(offset);
            textRef.current.position.copy(newTargetPosition);
        }
    }, [targetId, positions, offset]);

    useFrame(() => {
        if (textRef.current) {
            textRef.current.quaternion.copy(camera.quaternion);
        }
    });

    useImperativeHandle(ref, () => textRef.current);

    const isValidPosition = position && 'x' in position && 'y' in position && 'z' in position;

    return ((isValidPosition || targetId) && text) ? (
        <MotionText
            {...props}
            ref={textRef}
            color={color}
            visible={visible}
            anchorX="center"
            anchorY="middle"
            position={isValidPosition ? position : undefined}
            scale={[scale, scale, scale]}
            animate={animationState.variant || defaultVariant}
            variants={variants}
            transition={{ duration: animationState.duration || 0 }}
        >
            {text}
            <motion.meshBasicMaterial
                transparent
                side={THREE.DoubleSide}
                initialState={defaultVariant}
                animate={animationState.variant || defaultVariant}
                variants={variants}
                transition={{ duration: animationState.duration || 0 }}
                color={color}
            />
        </MotionText>
    ) : null;
});

export default withAnimationState(TargetText);
