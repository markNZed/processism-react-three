import React, { useEffect } from 'react';
import * as THREE from 'three';
import useStore from './useStore';

export function AnimationController({ children }) {
    const { batchUpdateAnimationStates, updateAnimationState } = useStore(state => ({
        batchUpdateAnimationStates: state.batchUpdateAnimationStates,
        updateAnimationState: state.updateAnimationState
    }));

    useEffect(() => {
        const timeouts = [];

        const speed = 1; // set to 1 for normal speed, 10 for 10x faster

        // Initial setup for animation states
        batchUpdateAnimationStates({
            'inter_emergent': { visible: false },
            'emergent1': { variant: "oneSphere" },
            'emergent1.Circle': { variant: "hidden" },
            'emergent2': { visible: false },
            'emergent2.Circle': { variant: "hidden" },
            'emergent2.causation': { visible: false },
        });

        // Delay, id, animationState
        const animationSteps = [
            [1, 'emergent1', { variant: "oneSphere-details", }],
            [1, 'entityLabel', { variant: "fadeIn", }],
            [1, 'entityLabel', { variant: "fadeOut", }],
            [1, 'emergent1', { variant: "twoSphere", why: "Showing second sphere" }],
            [1, 'emergent1', { variant: "relation" }],
            [1, 'emergent1', { variant: "allRelations" }],
            [1, 'accumulationDescription', { variant: "fadeIn" }],
            [1, 'accumulationDescription', { variant: "fadeOut" }],
            [1, 'emergent1.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
            [1, 'emergent1Label', { duration: 1, variant: "fadeIn" }],
            [1, 'emergent1Label', { duration: 1, variant: "fadeOut" }],
            [1, 'emergent2', { visible: true, variant: "allRelations" }],
            [1, 'emergent2.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
            [0.5, 'inter_emergent', { visible: true }],
            [2, 'camera', { position: [0, -30, 10], duration: 2000 }],
            [2, 'emergent2Label', { text: 'Bottom Up', variant: "fadeIn" }],
            [1, 'emergent1.causation', { visible: true }],
            [1, 'emergent1Label', { text: 'Top Down', variant: "fadeIn" }],
            [1, 'emergent2.causation', { visible: true }],
            [1, 'emergent1', { variant: "moved", offset: new THREE.Vector3(5, 5, 5) }],

        ];

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

        // Schedule all animation groups
        scheduleAnimations(animationSteps);

        return () => {
            timeouts.forEach(clearTimeout);  // Clear all timeouts
        };
    }, [batchUpdateAnimationStates, updateAnimationState]);

    return <>{children}</>;
}
