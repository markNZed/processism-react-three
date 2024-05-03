import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware'

const useStore = create(subscribeWithSelector(set => ({
  positions: {
  },
  updatePosition: (id, newPosition) => set(state => ({
    positions: {
      ...state.positions,
      [id]: newPosition
    }
  })),
  animationStates: {
  },
  setInitialAnimationState: (initialStates) => set({
    animationStates: { ...initialStates }
  }),
  updateAnimationState: (id, newState) => set(state => ({
    animationStates: {
      ...state.animationStates,
      [id]: { ...state.animationStates[id], ...newState }
    }
  }))
})));

/*
// Setting up a subscription to log specific or all changes
useStore.subscribe(
    state => state.positions, // Selecting what part of the state to subscribe to
    positions => console.log("Positions have changed:", positions)
);
*/
  
useStore.subscribe(
    state => state.animationStates,
    animationStates => console.log("Animation states have changed:", animationStates)
);


export default useStore;
