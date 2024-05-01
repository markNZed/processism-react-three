import React, { createContext, useState } from 'react';
import { useAnimationSequence } from './useAnimationSequence';

export const AnimationContext = createContext();

export function AnimationController({ children }) {
  const [animationState, setAnimationState] = useState({
    sphere: { scale: 1 },
    arrow: { position: 0 },
    text: { opacity: 0 }
  });

  // Define animation steps
  const steps = [
    { delay: 11000, action: () => setAnimationState(prev => ({ ...prev, sphere: { scale: 0.5 } })) },
    { delay: 2000, action: () => setAnimationState(prev => ({ ...prev, arrow: { position: 10 } })) },
    { delay: 3000, action: () => setAnimationState(prev => ({ ...prev, text: { opacity: 1 } })) }
  ];

  // Use custom hook to handle animation sequence
  useAnimationSequence(steps);

  return (
    <AnimationContext.Provider value={animationState}>
      {children}
    </AnimationContext.Provider>
  );
}
