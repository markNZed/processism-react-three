import { useEffect } from 'react';

/**
 * Custom hook to handle sequenced animations with delays.
 * @param {Array} steps - Array of steps where each step contains a `delay` and `action`.
 */
export const useAnimationSequence = (steps) => {
  useEffect(() => {
    let totalTime = 0;
    const timers = steps.map(step => {
      totalTime += step.delay;
      return setTimeout(step.action, totalTime);
    });

    // Cleanup function to clear all timeouts
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [steps]); // Ensure steps are stable, consider using useMemo or useCallback if they depend on props
};

