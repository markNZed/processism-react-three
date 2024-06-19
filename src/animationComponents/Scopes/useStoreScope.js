import { create } from 'zustand';

const useStoreScope = create((set, get) => ({
  scope: {},
  setScope: (id, objs) => set(state => ({
    scope: { ...state.scope, [id]: objs },
  })),
  getScope: (id) => get().scope[id] || [],
  getScopeCount: (id) => get().scope[id]?.length || 0,
  addScope: (id, obj) => set(state => {
    const existingObjs = state.scope[id] || [];
    // Check if an object with the same id is already in the array
    if (!existingObjs.some(existingObj => existingObj.id === obj.id)) {
      return {
        scope: { ...state.scope, [id]: [...existingObjs, obj] },
      };
    }
    // If an object with the same id already exists, return state unchanged
    return state;
  }),
  updateScope: (id, update) => set(state => {
    const existingObjs = state.scope[id] || [];
    const updatedObjs = existingObjs.map(existingObj => {
      if (existingObj.id === update.id) {
        if (typeof update === 'function') {
          return { ...existingObj, ...update(existingObj) };
        }
        return { ...existingObj, ...update };
      }
      return existingObj;
    });
    return {
      scope: { ...state.scope, [id]: updatedObjs },
    };
  }),
  removeScope: (id, objId) => set(state => {
    const existingObjs = state.scope[id] || [];
    return {
      scope: { 
        ...state.scope, 
        [id]: existingObjs.filter(existingObj => existingObj.id !== objId),
      },
    };
  }),
  clearScope: (id) => set(state => {
    const { [id]: _, ...newScope } = state.scope;
    return { scope: newScope };
  }),
  clearAllScopes: () => set({ scope: {} }),
}));

export default useStoreScope;
