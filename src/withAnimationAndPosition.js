import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpring } from '@react-spring/three';
import useStore from './useStore';

function withAnimationAndPosition(Component) {
    return function WrappedComponent({ id, initialPosition, ...props }) {

        const ref = useRef();
        const { positions, updatePosition, animationState } = useStore(state => ({
            positions: state.positions,
            updatePosition: state.updatePosition,
            animationState: state.animationStates[id]
        }));

        if (initialPosition === undefined) {
            if (props.from) {
                initialPosition = props.from;
            } else if (props.fromId && positions[props.fromId]) {
                initialPosition = positions[props.fromId]
            }
        }

        const { visible = true, opacity = 1, scale = 1, fadeInDuration = 1000 } = animationState || {};

        // React Spring animation for opacity
        const springProps = useSpring({
            to: { opacity: visible ? opacity : 0 },
            from: { opacity: 0 },
            config: { duration: fadeInDuration }
        });

        // Set initial position
        useEffect(() => {
            if (ref.current && positions[id] === undefined) {
                updatePosition(id, initialPosition);
            }
        }, []); // Empty dependency array means this runs only once on mount
        

        useFrame(() => {
            // ref.current.position is local position and initialPosition is world position ?
            if (ref.current && ref.current.position && positions[id] && !ref.current.position.equals(positions[id])) {
                //console.log("Updating position", id, JSON.parse(JSON.stringify(ref.current.position)), JSON.parse(JSON.stringify(ref.current)));
                //updatePosition(id, ref.current.position.clone());
            }
        });

        return (
            <Component
                ref={ref}
                id={id}
                initialPosition={initialPosition}
                opacity={springProps.opacity}
                scale={scale}
                {...props}
            />
        );
    };
}

export default withAnimationAndPosition;
