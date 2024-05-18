import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import * as THREE from 'three';

const CustomGroup = forwardRef(({ children, position }, ref) => {
  const internalRef = useRef();
  const impulseRef = useRef(new THREE.Vector3());
  const centerRef = useRef(new THREE.Vector3());

  useImperativeHandle(ref, () => ({
    get current() {
      return internalRef.current;
    },
    setImpulse: (newImpulse) => {
      impulseRef.current.copy(newImpulse);
    },
    getImpulse: () => {
      return impulseRef.current.clone();
    },
    addImpulse: (newImpulse) => {
      impulseRef.current.add(newImpulse);
    },
    getCenter: () => {
        return centerRef.current.clone();
    }, 
    setCenter: (center) => {
        return centerRef.current.copy(center);
    }, 
    worldToLocal: (vector) => {
      return internalRef.current.worldToLocal(vector);
    },
    localToWorld: (vector) => {
      return internalRef.current.localToWorld(vector);
    },
  }), [internalRef]);

  return (
    <group ref={internalRef} position={position}>
      {children}
    </group>
  );
});

export default CustomGroup;
