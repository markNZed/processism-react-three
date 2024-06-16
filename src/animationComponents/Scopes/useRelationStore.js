import { create } from 'zustand';

const useRelationStore = create((set, get) => ({
  relation: {},

  setRelation: (from, to, objs) => set(state => ({
    relation: { 
      ...state.relation, 
      [from]: { 
        ...state.relation[from],
        [to]: objs 
      },
    },
  })),

  getRelation: (from, to = null) => {
    if (to) {
      return get().relation[from]?.[to] || [];
    } else {
      return get().relation[from] || {};
    }
  },

  getRelations: (from) => (get().relation[from] || {}),

  getAllRelations: () => (get().relation || {}),

  addRelation: (from, to, objs) => set(state => {
    const existingFrom = state.relation[from] || {};
    const existingTo = existingFrom[to] || [];
    return {
      relation: { 
        ...state.relation, 
        [from]: { 
          ...existingFrom, 
          [to]: [...existingTo, ...objs] 
        },
      },
    };
  }),

  updateRelation: (from, to, update) => set(state => {
    const existingTo = state.relation[from]?.[to] || [];
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
      relation: { 
        ...state.relation, 
        [from]: { 
          ...state.relation[from], 
          [to]: updatedTo 
        },
      },
    };
  }),

  removeRelation: (from, to) => set(state => {
    if (state.relation[from]) {
      delete state.relation[from][to]
    }
    return {
      relation: {
        ...state.relation,
        [from]: state.relation[from],
      },
    };
  }),

  removeRelations: (from) => set(state => {
    return {
      relation: {
        ...state.relation,
        [from]: {},
      },
    };
  }),

  clearRelation: (from, to) => set(state => {
    if (!state.relation[from]) return state;
    const { [to]: _, ...newFrom } = state.relation[from];
    return { relation: { ...state.relation, [from]: newFrom } };
  }),

  clearAllRelations: () => set({ relation: {} }),
}));

export default useRelationStore;
