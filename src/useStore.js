import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

const useStore = create(devtools(subscribeWithSelector((set, get) => ({
  currentScene: undefined, 
  setCurrentScene: (currentScene) => set({ currentScene }), 
  reloadScene: false, 
  setReloadScene: (reloadScene) => set({ reloadScene }), 
  usePhysics: false, 
  setUsePhysics: (usePhysics) => set({ usePhysics }), 
  components: {},
  registerComponent: (id, ref) => set(state => {
    const sceneId = `${state.currentScene}.${id}`;
    if (state.components[sceneId]) {
      throw new Error(`Component with id "${sceneId}" is already registered`);
    }
    return { components: { ...state.components, [sceneId]: ref } };
  }),
  unregisterComponent: (id) => set(state => {
    const sceneId = `${state.currentScene}.${id}`;
    const newComponents = { ...state.components };
    delete newComponents[sceneId];
    return { components: newComponents };
  }),
  getComponentRef: (id) => {
    const sceneId = `${get().currentScene}.${id}`;
    return get().components[sceneId];
  },
  animationStates: {},
  getAnimationState: (id) => {
    const sceneId = `${get().currentScene}.${id}`;
    return get().animationStates[sceneId];
  },
  setInitialAnimationState: (initialStates) => set(state => {
    const sceneStates = Object.fromEntries(
      Object.entries(initialStates).map(([key, value]) => [`${state.currentScene}.${key}`, value])
    );
    return {
      animationStates: { ...state.animationStates, ...sceneStates }
    };
  }),
  lastUpdateAnimationState: {},
  updateAnimationState: (id, newState) => set(state => {
    const sceneId = `${state.currentScene}.${id}`;
    const newStateWithGlobal = { ...newState, why: newState.why ? sceneId + ': ' + newState.why : sceneId };
    return {
      animationStates: {
        ...state.animationStates,
        [sceneId]: { ...state.animationStates[sceneId], ...newStateWithGlobal }
      },
      lastUpdateAnimationState: newStateWithGlobal
    };
  }),
  batchUpdateAnimationStates: (updates) => set(state => {
    const sceneUpdates = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => {
        const sceneId = `${state.currentScene}.${key}`;
        return [
          sceneId,
          {
            ...state.animationStates[sceneId], // Preserve existing state
            ...value, // Update with new state
            why: value.why ? sceneId + ': ' + value.why : sceneId
          }
        ];
      })
    );
    const newState = { ...state.animationStates, ...sceneUpdates };
    return {
      animationStates: newState,
      lastUpdateAnimationState: sceneUpdates
    };
  }),
  clearAllAnimationStates: () => set({ animationStates: {} }),
}), { name: 'AnimationStore' }))); // Configure the naming for DevTools

// Subscribe only to changes in animationStates
useStore.subscribe(
  state => state.animationStates,
  animationStates => {
      const lastUpdateAnimationState = useStore.getState().lastUpdateAnimationState;
      console.log("Animation:", lastUpdateAnimationState.why, lastUpdateAnimationState);
  }
);

export default useStore;


