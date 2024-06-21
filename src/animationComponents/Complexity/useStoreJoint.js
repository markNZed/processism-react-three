import { create } from 'zustand';

const useStoreJoint = create((set, get) => ({
  joints: {},
  reset: () => set({
    joints: {}
  }),
  addJoint: (id, ref) => set(state => ({
    joints: { ...state.joints, [id]: ref },
  })),
  addJoints: (batch) => set(state => {
    const batchJoints = {};
    batch.forEach(([id1, id2, ref]) => {
      batchJoints[id1] = ref;
      batchJoints[id2] = ref;
    });
    return { ...state.joints, ...batchJoints};
  }),
  getJoint: (id) => get().joints[id],
  deleteJoint: (id) => set(state => ({
    joints: Object.fromEntries(Object.entries(state.joints).filter(([key]) => key !== id))
  })),
  clearAllJoints: () => set({ joints: {} }),
}));

export default useStoreJoint;
