import React from 'react';
import SceneOne from './scenes/SceneOne';
import SceneTwo from './scenes/SceneTwo';
import useStore from './useStore'; // Make sure the path is correct

function SceneManager() {
  const currentScene = useStore((state) => state.currentScene);

  return (
    <>
      {currentScene === 'SceneOne' ? <SceneOne /> : <SceneTwo />}
    </>
  );
}

export default SceneManager;

