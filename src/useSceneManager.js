import React, { useState, useEffect } from 'react'
import useStore from './useStore'
import SceneOne from './scenes/SceneOne'
import SceneTwo from './scenes/SceneTwo'
import SceneThree from './scenes/SceneThree'
import SceneFour from './scenes/SceneFour'

const useSceneManager = () => {
  const currentScene = useStore((state) => state.currentScene)
  const reloadScene = useStore((state) => state.reloadScene)
  const setReloadScene = useStore((state) => state.setReloadScene)
  const setUsePhysics = useStore((state) => state.setUsePhysics)
  const [key, setKey] = useState(0)
  const [sceneInfo, setSceneInfo] = useState({ sceneComponent: null, isOrthographic: true })

  useEffect(() => {
    // Update the key whenever the scene reloads
    if (reloadScene) {
      setKey((prevKey) => prevKey + 1)
      setReloadScene(false)
    }
  }, [reloadScene])

  useEffect(() => {
    console.log("useSceneManager mounting");
  }, []);

  useEffect(() => {
    if (!currentScene) return;

    let sceneComponent
    let isOrthographic = false

    switch (currentScene) {
      case 'SceneOne':
        sceneComponent = <SceneOne key={key} />
        isOrthographic = true
        setUsePhysics(false)
        break
      case 'SceneTwo':
        sceneComponent = <SceneTwo key={key} />
        isOrthographic = true
        setUsePhysics(true)
        break
      case 'SceneThree':
        sceneComponent = <SceneThree key={key} />
        isOrthographic = true
        setUsePhysics(true)
        break
      case 'SceneFour':
        sceneComponent = <SceneFour key={key} />
        isOrthographic = true
        setUsePhysics(true)
        break
      default:
        throw new Error(`Unknown Scene: ${currentScene}`)
    }

    setSceneInfo({ sceneComponent, isOrthographic })
  }, [currentScene, setUsePhysics, key])

  return { ...sceneInfo, key }
}

export default useSceneManager
