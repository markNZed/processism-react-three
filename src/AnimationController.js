import React, { useEffect } from 'react';
import * as THREE from 'three';

export function AnimationController({ children, animations, useStore }) {
    const { updateAnimationState } = useStore(state => ({
        updateAnimationState: state.updateAnimationState
    }));

    useEffect(() => {
        const timeouts = [];
        const speed = 1; // Adjust speed for different scenes if necessary

        const scheduleAnimations = (animations) => {
            let cumulativeDelay = 0;
            animations.forEach(([delay, id, newState]) => {
                cumulativeDelay += delay * 1000 / speed;
                const timeout = setTimeout(() => {
                    updateAnimationState(id, newState);
                }, cumulativeDelay);
                timeouts.push(timeout);
            });
        };

        scheduleAnimations(animations);

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [animations, updateAnimationState]);

    return <>{children}</>;
}
