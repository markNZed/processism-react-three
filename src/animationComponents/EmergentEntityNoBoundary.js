import React from 'react';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';
import { useMemo } from 'react';

const EmergentEntityNoBoundary = ({ id, initialState }) => {
  const { position, radius, sphereCount = 100 } = initialState;
  const spherePositions = useMemo(() => generateSpherePositions(radius, sphereCount), [radius, sphereCount]);

  return (
    <group position={position}>
      {spherePositions.map((pos, index) => (
        <Sphere key={`${id}-sphere-${index}`} position={pos} args={[0.1, 32, 32]}>
          <meshStandardMaterial color="blue" />
        </Sphere>
      ))}
    </group>
  );
};

export default EmergentEntityNoBoundary;

const generateSpherePositions = (radius, count) => {
    const positions = [];
    const layers = Math.sqrt(count); // Determine how many layers of spheres we need
    const sphereCountPerLayer = Math.floor(count / layers);
  
    for (let r = 0; r <= layers; r++) {
      const currentRadius = (r / layers) * radius;
      const layerCount = Math.floor(sphereCountPerLayer * (1 + (r / layers))); // Adjust the number of spheres per layer based on the radius
  
      for (let i = 0; i < layerCount; i++) {
        const angle = (i / layerCount) * 2 * Math.PI;
        positions.push(new THREE.Vector3(
          currentRadius * Math.cos(angle),
          currentRadius * Math.sin(angle),
          0
        ));
      }
    }
  
    return positions;
  };
  
  