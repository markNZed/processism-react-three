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

        const { visible = true, opacity = 1, scale = 1, fadeInDuration = 1000 } = animationState || {};

        // React Spring animation for opacity
        const springProps = useSpring({
            to: { opacity: visible ? opacity : 0 },
            from: { opacity: 0 },
            config: { duration: fadeInDuration }
        });

        // Set initial position
        useEffect(() => {
            if (ref.current && !positions[id]) {
                const newPosition = initialPosition || new THREE.Vector3(0, 0, 0);
                updatePosition(id, newPosition);
            }
        }, [initialPosition]);

        useFrame(() => {
            if (ref.current && positions[id] && !ref.current.position.equals(positions[id])) {
                updatePosition(id, ref.current.position.clone());
            }
        });

        return (
            <Component
                ref={ref}
                position={positions[id]}
                opacity={springProps.opacity}
                scale={scale}
                {...props}
            />
        );
    };
}

export default withAnimationAndPosition;
