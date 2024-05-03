import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion } from "framer-motion-3d"
import useStore from './useStore';
import * as THREE from 'three'

function withAnimationAndPosition(Component) {
    const MotionComponent = motion(Component); // Create a motion-enhanced component

    return function WrappedComponent({ id, initialPosition, ...props }) {
        const ref = useRef();
        const { positions, updatePosition, animationState } = useStore(state => ({
            positions: state.positions,
            updatePosition: state.updatePosition,
            animationState: state.animationStates[id]
        }));

        const { visible = true, opacity = 1, scale = 1 } = animationState || {};

        // Since we don't have useAnimation, we manage the animation state manually
        useEffect(() => {
            if (ref.current) {
                if (ref.current.scale !== undefined) {
                    ref.current.scale.set(scale, scale, scale);
                }
                if (ref.current.material !== undefined) {
                    ref.current.material.opacity = opacity;
                }
                if (ref.current.visible !== undefined) {
                    ref.current.visible = visible;
                }
            }
        }, [opacity, scale, visible]);

        // Set initial position
        useEffect(() => {
            if (ref.current && !positions[id]) {
                const newPosition = initialPosition || new THREE.Vector3(0, 0, 0);
                updatePosition(id, newPosition);
            }
        }, [initialPosition, id, positions, updatePosition]);

        // Synchronize Three.js object's position with the stored position
        useFrame(() => {
            // Local position vs global positions :()
            if (ref.current && positions[id] && !ref.current.position.equals(positions[id])) {
                //ref.current.position.copy(positions[id]);
            }
        });

        return (
            <MotionComponent
                ref={ref}
                id={id}
                initialPosition={initialPosition}
                {...props}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: visible ? opacity : 0, scale }}
                transition={{ duration: 1 }}
            />
        );
    };
}

export default withAnimationAndPosition;
