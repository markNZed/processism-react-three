import { useFrame } from '@react-three/fiber';
import { motion } from "framer-motion-3d";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import useAppStore from './useAppStore';

function withAnimationState(Component) {
    const MotionComponent = motion(Component);

    return function WrappedComponent({ id, initialState: initialStateFromProp, debug, ...props }) {
        const initialState = useMemo(() => initialStateFromProp, [])
        const ref = useRef();
        const rigidBodyRef = useRef();
        const registerComponent = useAppStore(state => state.registerComponent);
        const unregisterComponent = useAppStore(state => state.unregisterComponent);
        const animationState = useAppStore(state => state.getAnimationState(id) || {});
        const [simulationReady, setSimulationReady] = useState(false);

        // The MotionComponent calls this to pass the rigidBodyRef so it can be used in actions
        const setRigidBodyRef = (refIn) => {
            rigidBodyRef.current = refIn.current
        };

        useEffect(() => {
            if (debug) {
                console.log("DEBUG:", id, initialState);
            }
        }, [debug]);

        useEffect(() => {
            if (ref.current) {
                registerComponent(id, ref);
            }
            return () => {
                unregisterComponent(id);
            };
        }, [id, registerComponent, unregisterComponent]);

        useFrame(() => {
            if (ref.current && !simulationReady) {
                setSimulationReady(true);
            }
        });

        useEffect(() => {
            if (ref.current && rigidBodyRef.current && animationState.action) {
                const { name, params } = animationState.action;
                if (rigidBodyRef && typeof rigidBodyRef.current[name] === 'function') {
                    rigidBodyRef.current[name](...params);
                }
            }
        }, [animationState]);

        return (
            <MotionComponent
                {...props}
                ref={ref}
                id={id}
                animationState={{ ...initialState, ...animationState, ...props.animationState }}
                initialState={initialState}
                simulationReady={simulationReady}
                position={animationState?.position || initialState?.position}
                setRigidBodyRef={setRigidBodyRef}
                debug={debug}
            />
        );
    };
}

export default withAnimationState;
