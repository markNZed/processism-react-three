import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

const useStore = create(devtools(subscribeWithSelector((set, get) => ({
  positions: {},
  components: {}, // Object to store component references
  updatePosition: (id, newPosition) => set(state => ({
    positions: { ...state.positions, [id]: newPosition }
  })),
  getPosition: id => get().positions[id],
  registerComponent: (id, ref) => set(state => ({
    components: { ...state.components, [id]: ref }
  })),
  unregisterComponent: (id) => set(state => {
    const newComponents = { ...state.components };
    delete newComponents[id];
    return { components: newComponents };
  }),
  getComponentRef: id => get().components[id], // Function to get component ref by id
  animationStates: {},
  setInitialAnimationState: (initialStates) => set({
    animationStates: { ...initialStates }
  }),
  whyAnimationState: {},
  lastUpdateAnimationState: {},
  updateAnimationState: (id, newState) => set(state => {
    const newStateWithGlobal = { ...newState };
    if ('why' in newState) {
      // If 'why' is provided in newState, update the global 'why' value
      state.why = id + ': ' + newState.why;
    } else {
      state.why = id;
    }
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
}), { name: 'AnimationStore' }))); // Properly configure the naming for DevTools

/*

// Setting up a subscription to log specific or all changes
useStore.subscribe(
    state => state.positions, // Selecting what part of the state to subscribe to
    positions => console.log("Positions have changed:", positions)
);

*/

// Subscribe only to changes in animationStates but log 'why' as well
useStore.subscribe(
  state => state.animationStates,  // Only listen to changes in animationStates
  animationStates => {
      const why = useStore.getState().why;  // Retrieve 'why' at the time of logging
      const lastUpdateAnimationState = useStore.getState().lastUpdateAnimationState;
      console.log("Animation:", why, lastUpdateAnimationState);
  }
);

export default useStore;


