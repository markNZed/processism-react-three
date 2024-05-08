import React, { useRef, useEffect } from 'react';
import { motion } from "framer-motion-3d";
import useStore from './useStore';
import { Vector3 } from 'three';

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

        // Update component position on mount and when id or position changes
        useEffect(() => {
            if (ref.current && initialState) {
                const position = getPosition(id) || initialState.position || new Vector3(0, 0, 0);
                ref.current.position.copy(position);
            }
        }, [id, getPosition, initialState]);

        // Initialize or update position state
        useEffect(() => {
            if (ref.current && !getPosition(id) && initialState && initialState.position) {
                updatePosition(id, initialState.position);
            }
        }, [id, getPosition, updatePosition, initialState, ref.current]); // Ensure ref.current is also in the dependency array

        return (
            <MotionComponent
                {...props}
                ref={ref}
                id={id}
                animationState={{ ...initialState, ...animationState }}
                initialState={initialState}
            />
        );
    };
}

export default withAnimationAndPosition;
