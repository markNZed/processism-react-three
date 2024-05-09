import React, { useRef, useEffect, useState } from 'react';
import { motion } from "framer-motion-3d";
import useStore from './useStore';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

function withAnimationAndPosition(Component) {
    // Unsure if we need to wrap this here with motion
    const MotionComponent = motion(Component);

    return function WrappedComponent({ id, initialState, ...props }) {
        const ref = useRef();
        const getPosition = useStore(state => state.getPosition);
        const updatePosition = useStore(state => state.updatePosition);
        const registerComponent = useStore(state => state.registerComponent);
        const unregisterComponent = useStore(state => state.unregisterComponent);
        const animationState = useStore(state => state.animationStates[id] || {});
        const [simulationReady, setSimulationReady] = useState(false);
        const currentPos = getPosition(id);

        // Register and unregister component ref
        useEffect(() => {
            // Ensure ref.current is defined before registering
            if (ref.current) {
                registerComponent(id, ref);
            }
            // Cleanup function for unregistration
            return () => {
                unregisterComponent(id);
            };
        }, [id, registerComponent, unregisterComponent]);

        // Initialize position state
        useEffect(() => {
            if (ref.current && !getPosition(id) && initialState && initialState.position) {
                updatePosition(id, initialState.position);
            }
        }, [id, getPosition, updatePosition, initialState, ref.current]); // Ensure ref.current is also in the dependency array

        // Impulses at the mounting of a component were missed in the Rapier engine, so this makes sure we see a frame 
        useFrame(() => {
            if (ref.current) {
                if (!simulationReady) {
                    setSimulationReady(true);
                }
                const worldPosition = new Vector3();
                ref.current.updateMatrixWorld();
                ref.current.getWorldPosition(worldPosition);
                updatePosition(id, worldPosition);
            }
        });

        return (
            <MotionComponent
                {...props}
                ref={ref}
                id={id}
                animationState={{ ...initialState, ...animationState }}
                initialState={initialState}
                simulationReady={simulationReady}
                position={currentPos}
            />
        );
    };
}

export default withAnimationAndPosition;
