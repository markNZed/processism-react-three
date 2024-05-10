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
            'emergent1': { labelText: "Emergent Entity" },
            'emergent1.Sphere1': { labelText: "Entity" },
            'emergent1.Circle': { variant: "hidden" },
            'emergent2': { visible: false },
            'emergent2.Circle': { variant: "hidden" },
            'emergent2.label': { visible: false },
            'emergent2.causation': { visible: false },
        });

        const speed = 1; // set to 1 for normal speed, 10 for 10x faster

        const scheduleAnimations = (animations) => {
            let cumulativeDelay = 0; // Initialize cumulative delay
            animations.forEach(([delay, id, newState]) => {
                cumulativeDelay += delay * 1000 / speed; // Increase cumulative delay by current delay
                const timeout = setTimeout(() => {
                    updateAnimationState(id, newState);
                }, cumulativeDelay); // Use cumulative delay for timeout
                timeouts.push(timeout);
            });
        };

        // Delay, id, animationState
        const animationSteps = [
            [1,   'emergent1', { variant: "oneSphere-details", }],
            [1,   'emergent1', { variant: "twoSphere", why: "Showing second sphere" }],
            [1,   'emergent1', { variant: "relation" }],
            [1,   'emergent1', { variant: "allRelations" }],
            [1,   'emergent1', { variant: "accumulation-description", label2Text: "Accumulation" }],
            [1,   'emergent1', { variant: "accumulation-description-end" }],
            [1,   'emergent1.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
            [1,   'emergent1.label', { visible: true }],
            [2,   'emergent1.label', { visible: false }],
            [1,   'emergent2', { visible: true }],
            [0,   'emergent2.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
            [0,   'camera', { position: [0, -30, 10], duration: 2000 }],
            [2,   'emergent1', { labelText: "Bottom-up" }],
            [0,   'emergent1.label', { visible: true }],
            [1,   'emergent1.causation', { visible: true }],
            [0.5, 'inter_emergent', { visible: true }],
            [1,   'emergent2', { labelText: "Top-down" }],
            [0,   'emergent2.label', { visible: true }],
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
