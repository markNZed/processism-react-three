import React, { useRef, useEffect, useState } from 'react';
import { motion } from "framer-motion-3d";
import useStore from './useStore';
import { useFrame } from '@react-three/fiber';

function withAnimationState(Component) {
    // Unsure if we need to wrap this here with motion
    const MotionComponent = motion(Component);

    return function WrappedComponent({ id, initialState, ...props }) {
        const ref = useRef();
        const registerComponent = useStore(state => state.registerComponent);
        const unregisterComponent = useStore(state => state.unregisterComponent);
        const animationState = useStore(state => state.animationStates[id] || {});
        const [simulationReady, setSimulationReady] = useState(false);

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

        // Impulses at the mounting of a component were missed in the Rapier engine, so this makes sure we see a frame 
        useFrame(() => {
            if (ref.current) {
                if (!simulationReady) {
                    setSimulationReady(true);
                }
            }
        });

        return (
            <MotionComponent
                {...props}
                ref={ref}
                id={id}
                animationState={{ ...initialState, ...animationState, ...props.animationState }}
                initialState={initialState}
                simulationReady={simulationReady}
                position={animationState.position || initialState.position}
            />
        );
    };
}

export default withAnimationState;
