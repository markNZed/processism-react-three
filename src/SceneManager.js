import React, { useState, useEffect } from 'react';
import useStore from './useStore';
import SceneOne from './scenes/SceneOne';
import SceneTwo from './scenes/SceneTwo';

const SceneManager = () => {
  const currentScene = useStore((state) => state.currentScene);
  const reloadScene = useStore((state) => state.reloadScene);
  const setReloadScene = useStore((state) => state.setReloadScene);
  const [key, setKey] = useState(0);
  const setUsePhysics = useStore((state) => state.setUsePhysics);

  useEffect(() => {
    // Update the key whenever the current scene changes to trigger remount
    setKey(prevKey => prevKey + 1);
    setReloadScene(false);
  }, [reloadScene]);

  let sceneComponent;
  let isOrthographic = false;

  switch (currentScene) {
    case 'SceneOne':
      sceneComponent = <SceneOne />;
      isOrthographic = true;
      setUsePhysics(false);
      break;
    case 'SceneTwo':
      sceneComponent = <SceneTwo />;
      isOrthographic = true;
      setUsePhysics(true);
      break;
    default:
      isOrthographic = true;
      break;
  }

  return { sceneComponent, isOrthographic, key };
};

export default SceneManager;
