import React, { useState, useEffect } from 'react'
import useAppStore from './useAppStore'
import SceneOne from './scenes/SceneOne'
import SceneTwo from './scenes/SceneTwo'
import SceneThree from './scenes/SceneThree'

const useSceneManager = () => {
  const currentScene = useAppStore((state) => state.currentScene)
  const reloadScene = useAppStore((state) => state.reloadScene)
  const setReloadScene = useAppStore((state) => state.setReloadScene)
  const setUsePhysics = useAppStore((state) => state.setUsePhysics)
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
      default:
        throw new Error(`Unknown Scene: ${currentScene}`)
    }

    setSceneInfo({ sceneComponent, isOrthographic })
  }, [currentScene, setUsePhysics, key])

  return { ...sceneInfo, key }
}

export default useSceneManager
