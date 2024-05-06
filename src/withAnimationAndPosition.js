import React, { useRef, useEffect } from 'react';
import { motion } from "framer-motion-3d";
import useStore from './useStore';
import { Vector3 } from 'three';

function withAnimationAndPosition(Component) {
    const MotionComponent = motion(Component);

    return function WrappedComponent({ id, initialState, ...props }) {
        const ref = useRef();
        const getPosition = useStore(state => state.getPosition);
        const updatePosition = useStore(state => state.updatePosition);
        const animationState = useStore(state => state.animationStates[id] || {});

        useEffect(() => {
            if (ref.current && initialState) {
                const position = getPosition(id) || initialState.position || new Vector3(0, 0, 0);
                ref.current.position.copy(position);
            }
        }, [id, getPosition, initialState]);

        useEffect(() => {
            if (ref.current && !getPosition(id) && initialState && initialState.position) {
                updatePosition(id, initialState.position);
            }
        }, [initialState, id, getPosition, updatePosition]);

        return (
            <MotionComponent
                ref={ref}
                id={id}
                animationState={{ ...initialState, ...animationState }}
                {...props}
            />
        );
    };
}

export default withAnimationAndPosition;
