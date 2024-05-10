import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

const useStore = create(devtools(subscribeWithSelector((set, get) => ({
  usePhysics: false, 
  setUsePhysics: (usePhysics) => set({ usePhysics }), 
  components: {},
  registerComponent: (id, ref) => set(state => ({
    components: { ...state.components, [id]: ref }
  })),
  unregisterComponent: (id) => set(state => {
    const newComponents = { ...state.components };
    delete newComponents[id];
    return { components: newComponents };
  }),
  getComponentRef: id => get().components[id],
  animationStates: {},
  setInitialAnimationState: (initialStates) => set({
    animationStates: { ...initialStates }
  }),
  lastUpdateAnimationState: {},
  updateAnimationState: (id, newState) => set(state => {
    if ('why' in newState) {
      newState.why = id + ': ' + newState.why;
    } else {
      newState.why = id;
    }
    const newStateWithGlobal = { ...newState };
    state.lastUpdateAnimationState = newStateWithGlobal;
    return {
      ...state,
      animationStates: {
        ...state.animationStates,
        [id]: { ...state.animationStates[id], ...newStateWithGlobal }
      },
    };
  }),
  batchUpdateAnimationStates: (updates) => set(state => {
    const newState = { ...state.animationStates };
    Object.entries(updates).forEach(([id, update]) => {
      newState[id] = { ...newState[id], ...update };
    });
    return { animationStates: newState };
  }),
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


