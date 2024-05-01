import React, { createContext, useState, useEffect } from 'react';

export const AnimationContext = createContext();

export function AnimationController({ children }) {

  // To hide things we need to initialise here
  const [animationState, setAnimationState] = useState({
    'emergent1.boundary': {
      visible: false,
      fadeInDuration: 0,
    }
  });

  useEffect(() => {
    // Define animation for multiple spheres by ID
    const animate = (id, delay, newState) => {
      setTimeout(() => {
        setAnimationState(prevStates => ({
          ...prevStates,
          [id]: { ...prevStates[id], ...newState }
        }));
      }, delay);
    }; 

    // Example animations for different spheres
    animate('emergent1.sphere1', 1000, { scale: 2 });
    animate('emergent1.boundary', 2000, { visible: true });
    animate('emergent1.sphere2', 2000, { scale: 1.5 });
    animate('emergent1.sphere3', 3000, { scale: 0.8 });

    return () => {
      // Clear all timeouts if necessary
    };
  }, []);

  return (
    <AnimationContext.Provider value={animationState}>
      {children}
    </AnimationContext.Provider>
  );
}
