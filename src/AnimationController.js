import React, { useEffect } from 'react';
import useStore from './useStore';

export function AnimationController({ children }) {
    const { setInitialAnimationState, updateAnimationState } = useStore(state => ({
        setInitialAnimationState: state.setInitialAnimationState,
        updateAnimationState: state.updateAnimationState
    }));

    useEffect(() => {
        const timeouts = [];

        // Initial setup for animation states
        setInitialAnimationState({
            'inter_emergent': { visible: false },
            'emergent1.Circle': { opacity: 0 },
            'emergent1.causation': { visible: false },
            'emergent2': { visible: false },
            'emergent2.causation': { visible: false },
            'emergent2.Circle': { opacity: 0 },
        });

        const scheduleAnimations = (animations) => {
            let cumulativeDelay = 0; // Initialize cumulative delay

            animations.forEach(([id, delay, newState]) => {
                cumulativeDelay += delay * 1000; // Increase cumulative delay by current delay
                const timeout = setTimeout(() => {
                    updateAnimationState(id, newState);
                }, cumulativeDelay); // Use cumulative delay for timeout
                timeouts.push(timeout);
            });
        };

        // id, relative delay, animationState
        const animationSteps = [
            ['emergent1', 0, { variant: "oneSphere" }],
            ['emergent1', 1, { variant: "twoSphere" }],
            ['emergent1', 1, { variant: "relation" }],
            ['emergent1', 1, { variant: "allRelations" }],
            ['emergent1.Circle', 1, { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
            ['emergent2', 0, { visible: true }],
            ['inter_emergent', 0.5, { visible: true }],
            ['emergent1.causation', 0.5, { visible: true }],
            ['emergent2.causation', 0.5, { visible: true }]
        ];

        // Schedule all animation groups
        scheduleAnimations(animationSteps);

        return () => {
            timeouts.forEach(clearTimeout);  // Clear all timeouts
        };
    }, [setInitialAnimationState, updateAnimationState]);

    return <>{children}</>;
}
