import { create } from 'zustand';
import * as THREE from 'three'

const useStore = create(set => ({
  positions: {
    emergent1: new THREE.Vector3(-3, 0, 0),
    emergent2: new THREE.Vector3(3, 0, 0),
  },
  updatePosition: (id, newPosition) => set(state => ({
    positions: {
      ...state.positions,
      [id]: newPosition
    }
  }))
}));

export default useStore;
