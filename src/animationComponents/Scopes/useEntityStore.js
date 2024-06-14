import { create } from 'zustand';

const useEntityStore = create((set, get) => ({
  entityRefs: {},
  setEntityRefs: (id, refs) => set(state => ({
    entityRefs: { ...state.entityRefs, [id]: refs },
  })),
  getEntityRefs: (id) => get().entityRefs[id] || [],
  initializeEntityRefs: (id, count) => {
    if (!get().entityRefs[id]) {
      const refs = Array.from({ length: count }, () => ({ current: null }));
      set(state => ({
        entityRefs: { ...state.entityRefs, [id]: refs },
      }));
    }
  },
}));

export default useEntityStore;
