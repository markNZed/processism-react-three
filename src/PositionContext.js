import React, { createContext, useState } from 'react';

// Create the context
export const PositionContext = createContext();

// Provider component
export const PositionProvider = ({ children }) => {
  const [positions, setPositions] = useState({});

  // Function to update positions
  const updatePosition = (id, position) => {
    setPositions(prev => ({ ...prev, [id]: position }));
  };

  return (
    <PositionContext.Provider value={{ positions, updatePosition }}>
      {children}
    </PositionContext.Provider>
  );
};
