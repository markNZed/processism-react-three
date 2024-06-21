import { create } from 'zustand';

const useStoreRelation = create((set, get) => ({
  relations: {},

  reset: () => set({
    relations: {}
  }),

  setRelation: (from, to, objs) => set(state => ({
    relations: { 
      ...state.relations, 
      [from]: { 
        ...state.relations[from],
        [to]: objs 
      },
    },
  })),

  getRelation: (from, to = null) => {
    if (to) {
      return get().relations[from]?.[to] || [];
    } else {
      return get().relations[from] || {};
    }
  },

  getRelations: (from) => (get().relations[from] || {}),

  getAllRelations: () => (get().relations || {}),

  addRelation: (from, to, objs) => set(state => {
    const existingFrom = state.relations[from] || {};
    const existingTo = existingFrom[to] || [];
    return {
      relations: { 
        ...state.relations, 
        [from]: { 
          ...existingFrom, 
          [to]: [...existingTo, ...objs] 
        },
      },
    };
  }),

  updateRelation: (from, to, update) => set(state => {
    const existingTo = state.relations[from]?.[to] || [];
    const updatedTo = existingTo.map(existingObj => {
      if (existingObj.id === update.id) {
        if (typeof update === 'function') {
          return { ...existingObj, ...update(existingObj) };
        }
        return { ...existingObj, ...update };
      }
      return existingObj;
    });
    return {
      relations: { 
        ...state.relations, 
        [from]: { 
          ...state.relations[from], 
          [to]: updatedTo 
        },
      },
    };
  }),

  removeRelation: (from, to) => set(state => {
    if (state.relations[from]) {
      delete state.relations[from][to]
    }
    return {
      relations: {
        ...state.relations,
        [from]: state.relations[from],
      },
    };
  }),

  removeRelations: (from) => set(state => {
    return {
      relations: {
        ...state.relations,
        [from]: {},
      },
    };
  }),

  clearRelation: (from, to) => set(state => {
    if (!state.relations[from]) return state;
    const { [to]: _, ...newFrom } = state.relations[from];
    return { relations: { ...state.relations, [from]: newFrom } };
  }),

  clearAllRelations: () => set({ relations: {} }),
}));

export default useStoreRelation;
