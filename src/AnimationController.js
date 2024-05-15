import React, { useEffect } from 'react';
import { useStore } from 'zustand';

export function AnimationController({ children, animations, useStore }) {
    const { updateAnimationState } = useStore(state => ({
        updateAnimationState: state.updateAnimationState,
    }));

    useEffect(() => {
        const timeouts = [];
        const speed = 1; // Adjust speed for different scenes if necessary

        const scheduleAnimations = (animations, cumulativeDelay = 0) => {
            animations.forEach(animation => {
                if (Array.isArray(animation[0])) {
                    scheduleAnimations(animation, cumulativeDelay);
                } else {
                    // Sequential animation
                    const [delay, id, newState] = animation;
                    cumulativeDelay += delay * 1000 / speed;
                    const timeout = setTimeout(() => {
                        updateAnimationState(id, newState);
                    }, cumulativeDelay);
                    timeouts.push(timeout);
                }
            });
        };

        scheduleAnimations(animations);

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [animations, updateAnimationState]);

    return <>{children}</>;
}
