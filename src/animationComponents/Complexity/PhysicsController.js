import { useRef } from 'react';
import { useRapier, useBeforePhysicsStep, useAfterPhysicsStep } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import useAppStore from '../../useAppStore'

const PhysicsController = ({ config }) => {
    const { step } = useRapier();
    const startTimeRef = useRef(0);
    const durations = useRef([]);
    const AVERAGE_OVER = 1000;
    const stepCount = useRef(0); // Counter to track the number of steps

    const pausePhysics = useAppStore((state) => state.pausePhysics);

    const onPhysicsStepComplete = (averageDuration) => {
        if (stepCount.current >= AVERAGE_OVER) {
            console.log(`Average step duration over last 100 steps: ${averageDuration.toFixed(2)} ms`);
            stepCount.current = 0; // Reset the step count
        }
    };

    useBeforePhysicsStep(() => {
        startTimeRef.current = performance.now();
    });

    useAfterPhysicsStep(() => {
        const endTime = performance.now();
        const duration = endTime - startTimeRef.current;
        durations.current.push(duration);
        if (durations.current.length > AVERAGE_OVER) {
            durations.current.shift(); // Keep only the last 1000 entries
        }

        stepCount.current++;

        const averageDuration = durations.current.reduce((a, b) => a + b, 0) / durations.current.length;
        onPhysicsStepComplete(averageDuration);

        startTimeRef.current = endTime; // Update the last step end time
    });

    useFrame(() => {
        const fixedDelta = 2 / (60 * config.slowdown); // Adjust the fixedDelta based on the slowdown factor
        if (!pausePhysics) {
            step(fixedDelta);
        }
    });

    return null; // This component does not render anything
};

export default PhysicsController;

    