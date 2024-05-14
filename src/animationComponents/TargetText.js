import { Text as DreiText } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { motion } from "framer-motion-3d";
import React, { useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

import withAnimationState from '../withAnimationState';

const MotionText = motion(DreiText);

// @ts-check

const getMeshByUserDataValue = (scene, name, value) => {
    const meshes = [];

    scene.traverse((node) => {
        if (node.userData[name] === value) {
            meshes.push(node);
        }
    });

    return meshes;
};

const TargetText = React.forwardRef(({ targetId, offset, id, animationState, ...props }, ref) => {
    const { text, color = 'black', scale = 1, visible = true, position } = animationState;

    // We need textRef because we modify the ref in useFrame and cannot modify ref from parent
    const textRef = useRef();

    const { camera } = useThree();  // Access the camera from the R3F context

    // Define motion variants
    const variants = {
        hidden: { opacity: 0 },
        fadeIn: { opacity: 1, transition: { duration: 1 } },
        fadeOut: { opacity: 0, transition: { duration: 1 } },
        visible: { opacity: 1, }
    };

    // Verify position is not undefined
    const isValidPosition = position && 'x' in position && 'y' in position && 'z' in position;

    // Use Frame hook to update text orientation to always face the camera
    useFrame((state) => {
        const { scene } = state;
        // const target = scene.getObjectByProperty('globalId', targetId);
        const target = getMeshByUserDataValue(scene, 'globalId', targetId)[0];
        if (target && textRef.current) {
            const targetPosition = new THREE.Vector3();
            target.getWorldPosition(targetPosition);
            console.log('offset', offset);
            targetPosition.add(offset);
            textRef.current.position.copy(targetPosition);
            // textRef.current.lookAt(targetPosition);
        }
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
export default withAnimationState(TargetText);
