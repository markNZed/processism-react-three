import React, { useState, useEffect } from 'react';
import useStore from './useStore';
import SceneOne from './scenes/SceneOne';
import SceneTwo from './scenes/SceneTwo';
import SceneThree from './scenes/SceneThree';

const SceneManager = () => {
  const currentScene = useStore((state) => state.currentScene);
  const reloadScene = useStore((state) => state.reloadScene);
  const setReloadScene = useStore((state) => state.setReloadScene);
  const setUsePhysics = useStore((state) => state.setUsePhysics);
  const [key, setKey] = useState(0);
  const [sceneInfo, setSceneInfo] = useState({ sceneComponent: null, isOrthographic: true });

  useEffect(() => {
    // Update the key whenever the scene reloads
    setKey((prevKey) => prevKey + 1);
    setReloadScene(false);
  }, [reloadScene]);

  useEffect(() => {
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
      case 'SceneThree':
        sceneComponent = <SceneThree />;
        isOrthographic = true;
        setUsePhysics(true);
        break;
      default:
        sceneComponent = <SceneOne />;
        isOrthographic = true;
        setUsePhysics(false);
        break;
    }

    setSceneInfo({ sceneComponent, isOrthographic });
  }, [currentScene, setUsePhysics]);

  return { ...sceneInfo, key };
};

export default SceneManager;
