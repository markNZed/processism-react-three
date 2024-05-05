import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion } from "framer-motion-3d"
import useStore from './useStore';
import * as THREE from 'three'

function withAnimationAndPosition(Component) {
    const MotionComponent = motion(Component); // Create a motion-enhanced component

    return function WrappedComponent({ id, initialState, ...props }) {
        const ref = useRef();
        const { positions, updatePosition, animationState } = useStore(state => ({
            positions: state.positions,
            updatePosition: state.updatePosition,
            animationState: state.animationStates[id] || {}
        }));

        // Set initialState position
        useEffect(() => {
            if (ref.current && !positions[id] && initialState) {
                const newPosition = initialState.position || new THREE.Vector3(0, 0, 0);
                updatePosition(id, newPosition);
            }
        }, [initialState, id, positions, updatePosition]);

        // Synchronize Three.js object's position with the stored position
        useFrame(() => {
            // Local position vs global positions :(
            if (ref.current && positions[id] && !ref.current.position.equals(positions[id])) {
                //ref.current.position.copy(positions[id]);
            }
        });

        return (
            <MotionComponent
                ref={ref}
                id={id}
                initialState={initialState}
                {...props}
                animationState={animationState}
            />
        );
    };
}

export default withAnimationAndPosition;
