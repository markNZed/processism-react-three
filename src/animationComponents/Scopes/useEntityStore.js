import { create } from 'zustand';

const useEntityStore = create((set, get) => ({
  entityRefs: {},
  setEntityRefs: (indexArray, refs) => set(state => ({
    entityRefs: { ...state.entityRefs, [indexArray.join('.')]: refs },
  })),
  getEntityRefs: (indexArray) => {
    return get().entityRefs[indexArray.join('.')] || [];
  },
  initializeEntityRefs: (indexArray, count) => {
    const key = indexArray.join('.');
    if (!get().entityRefs[key]) {
      const refs = Array.from({ length: count }, () => ({ current: null }));
      set(state => ({
        entityRefs: { ...state.entityRefs, [key]: refs },
      }));
    }
  },
  getEntityRefByPath: (path) => {
    const key = path.slice(0, -1).join('.');
    const index = path[path.length - 1];
    return get().entityRefs[key]?.[index];
  },
}));

export default useEntityStore;
