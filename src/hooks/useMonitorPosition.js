import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function useMonitorPosition(objectRef, updatePositions, id, epsilon = 0.0001) {
    const lastPosition = useRef(new THREE.Vector3());
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (objectRef?.current) {
          objectRef.current.getWorldPosition(lastPosition.current);
        }
      }, [objectRef]);

    useFrame(() => {
        if (!objectRef?.current) return;
        
        const currentPosition = new THREE.Vector3();
        objectRef.current.getWorldPosition(currentPosition);

        if (!initialized || !lastPosition.current.equals(currentPosition) && lastPosition.current.distanceToSquared(currentPosition) > epsilon * epsilon) {
            lastPosition.current.copy(currentPosition);
            updatePositions(id, currentPosition);
            setInitialized(true);
        }
    });
}

export default useMonitorPosition;
