import { create } from 'zustand';

const useJointStore = create((set, get) => ({
  joint: {},
  setJoint: (id, objs) => set(state => ({
    joint: { ...state.joint, [id]: objs },
  })),
  getJoint: (id) => get().joint[id] || [],
  addJoint: (id, obj) => set(state => {
    const existingObjs = state.joint[id] || [];
    // Check if an object with the same id is already in the array
    if (!existingObjs.some(existingObj => existingObj.id === obj.id)) {
      return {
        joint: { ...state.joint, [id]: [...existingObjs, obj] },
      };
    }
    // If an object with the same id already exists, return state unchanged
    return state;
  }),
  updateJoint: (id, update) => set(state => {
    const existingObjs = state.joint[id] || [];
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
      joint: { ...state.joint, [id]: updatedObjs },
    };
  }),
  removeJoint: (id, objId) => set(state => {
    const existingObjs = state.joint[id] || [];
    return {
      joint: { 
        ...state.joint, 
        [id]: existingObjs.filter(existingObj => existingObj.id !== objId),
      },
    };
  }),
  clearJoint: (id) => set(state => {
    const { [id]: _, ...newJoint } = state.joint;
    return { joint: newJoint };
  }),
  clearAllJoints: () => set({ joint: {} }),
}));

export default useJointStore;
