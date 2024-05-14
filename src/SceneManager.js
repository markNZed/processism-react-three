import React, { useEffect } from 'react';
import SceneOne from './scenes/SceneOne';
import SceneTwo from './scenes/SceneTwo';
import { Html } from '@react-three/drei';
import useStore from './useStore'; // Make sure the path is correct

function SceneManager() {
  const currentScene = useStore(state => state.currentScene);
  const setCurrentScene = useStore(state => state.setCurrentScene);
  const clearAllAnimationStates = useStore(state => state.clearAllAnimationStates);

  // Helper function to initialize or switch scenes
  const initializeScene = (sceneName) => {
    clearAllAnimationStates();  // Clear all animation states
    setCurrentScene(sceneName);  // Set the current scene
  };

  // Initialize the scene on component mount
  useEffect(() => {
    initializeScene('SceneOne');
  }, []);

  return (
    <>
      {currentScene === 'SceneOne' ? <SceneOne /> : <SceneTwo />}
      <Html>
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <button onClick={() => initializeScene('SceneTwo')}>Go to Scene Two</button>
          <button onClick={() => initializeScene('SceneOne')}>Go to Scene One</button>
        </div>
      </Html>
    </>
  );
}

export default SceneManager;
