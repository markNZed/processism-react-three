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
            'emergent1': { variant: "oneSphere" },
            'emergent1.Sphere1': { text: "Entity" },
            'emergent1.Sphere1.text': { visible: false },
            'emergent1.Circle': { variant: "hidden" }, // initializes opacity to 0
            'emergent2': { visible: false },
            'emergent2.Circle': { variant: "hidden" }, // initializes opacity to 0
            'emergent2.text': { visible: false },
            'emergent2.causation': { visible: false },
        });

        const delta = 1; // set to 1 for normal speed, 0.1 for 10x faster

        const scheduleAnimations = (animations) => {
            let cumulativeDelay = 0; // Initialize cumulative delay
            animations.forEach(([delay, id, newState]) => {
                cumulativeDelay += delay * 1000 * delta; // Increase cumulative delay by current delay
                const timeout = setTimeout(() => {
                    updateAnimationState(id, newState);
                }, cumulativeDelay); // Use cumulative delay for timeout
                timeouts.push(timeout);
            });
        };

        // Delay, id, animationState
        const animationSteps = [
            [2,   'emergent1.Sphere1.text', { visible: true }],
            [1,   'emergent1.Sphere1.text', { visible: false }],
            [1,   'emergent1', { variant: "twoSphere", why: "Showing second sphere" }],
            [1,   'emergent1', { variant: "relation" }],
            [1,   'emergent1', { variant: "allRelations" }],
            [1,   'emergent1.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
            [1,   'emergent1.text', { visible: true }],
            [2,   'emergent1.text', { visible: false }],
            [1,   'emergent2', { visible: true }],
            [0,   'emergent2.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
            [0,   'camera', { position: [0, -20, 0] }],
            [1,   'emergent1.text', { visible: true, text: "Bottom-up" }],
            [1,   'emergent1.causation', { visible: true }],
            [0.5, 'inter_emergent', { visible: true }],
            [1,   'emergent2.text', { visible: true, text: "Top-down" }],
            [1,   'emergent2.causation', { visible: true }],

        ];

        // Schedule all animation groups
        scheduleAnimations(animationSteps);

        return () => {
            timeouts.forEach(clearTimeout);  // Clear all timeouts
        };
    }, [setInitialAnimationState, updateAnimationState]);

    return <>{children}</>;
}
