import React, { useEffect, useMemo, useRef } from 'react';
import { Sphere } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { RigidBody, RigidBodyApi, vec3 } from '@react-three/rapier';
import * as THREE from 'three';

const EmergentEntityNoBoundary = ({ id, initialState }) => {
  const { position, radius, sphereCount = 100 } = initialState;
  const sphereRefs = useRef([]);
  const reversedDirection = useRef(new Array(sphereCount).fill(false));
  const sphereRadius = 0.1; // Radius of each sphere
  const sphereDiameter = sphereRadius * 2;

  const sphereData = useMemo(() => {
    const positions = generateSpherePositions(radius, sphereCount, sphereRadius);
    const directions = positions.map(() => new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      0 // No movement in the Z direction
    ));
    return { positions, directions };
  }, [radius, sphereCount]);

  useEffect(() => {
    console.log("sphereData", sphereData);
  }, []);

  useFrame(() => {
    sphereRefs.current.forEach((sphere, index) => {
      if (sphere) {
        const pos = sphere.translation();

        // Convert pos to a THREE.Vector3
        const posVector = new THREE.Vector3(pos.x, pos.y, pos.z);
        const groupCenter = new THREE.Vector3(...position);
        const localPos = posVector.clone().sub(groupCenter);

        let impulseMultiplier = 0.00001;

        // Check if the sphere is out of bounds and adjust direction towards the center
        if (localPos.length() > radius * 1.2) {
            const directionToCenter = groupCenter.clone().sub(posVector).normalize();
            sphereData.directions[index] = directionToCenter;
            impulseMultiplier = impulseMultiplier * 100;
        } else if (localPos.length() > radius) {
          if (!reversedDirection.current[index]) {
            // Get the current linear velocity of the sphere
            const velocity = sphere.linvel();

            // Reverse the direction
            const reversedVelocity = new THREE.Vector3(-velocity.x, -velocity.y, 0);
            
            // Update the direction with the reversed velocity
            sphereData.directions[index] = reversedVelocity.normalize();

            reversedDirection.current[index] = true; // Mark as reversed
          }
          impulseMultiplier = impulseMultiplier * 10;
        } else {
          // Reset reversed direction state if the sphere is back within the bounds
          reversedDirection.current[index] = false;
        }

        // Apply an impulse to the sphere in the direction vector
        const direction = sphereData.directions[index];
        const impulse = { x: direction.x * impulseMultiplier, y: direction.y * impulseMultiplier, z: 0 };
        sphere.applyImpulse(impulse, true);

        // Apply a repulsion force to avoid clumping
        sphereRefs.current.forEach((otherSphere, otherIndex) => {
            if (otherSphere && otherIndex !== index) {
            const otherPos = otherSphere.translation();
            const otherPosVector = new THREE.Vector3(otherPos.x, otherPos.y, otherPos.z);
            const distance = posVector.distanceTo(otherPosVector);

            if (distance < sphereDiameter) {
                const repulsionForce = posVector.clone().sub(otherPosVector).normalize().multiplyScalar(impulseMultiplier);
                sphere.applyImpulse({ x: repulsionForce.x, y: repulsionForce.y, z: 0 }, true);
            }
            }
        });

        }

    });
  });


  return (
      <group position={position}>
        {sphereData.positions.map((pos, index) => (
          <RigidBody
            key={`${id}-sphere-${index}`}
            ref={el => sphereRefs.current[index] = el}
            position={pos}
            //linearVelocity={[sphereData.directions[index].x, sphereData.directions[index].y, 0]}
            type="dynamic"
            //colliders={false} this removes mass
            enabledTranslations={[true, true, false]}
            colliders="ball" // Ensure a proper collider type is set
            linearDamping={0.9} // Add damping to smooth motion
            angularDamping={0.9}
          >
            <Sphere args={[0.1, 32, 32]}>
              <meshStandardMaterial color="blue" />
            </Sphere>
          </RigidBody>
        ))}
        {/*}
        <RigidBody type="fixed" colliders="hull">
          <Sphere args={[radius, 64, 64]}>
            <meshStandardMaterial transparent={true} opacity={0} /> 
          </Sphere>
        </RigidBody>
        */}
      </group>
  );
};

export default EmergentEntityNoBoundary;

const generateSpherePositions = (radius, count, sphereRadius) => {
    const positions = [];
    const diameter = radius * 2;
  
    // Calculate grid spacing to fit the square inside the circle
    const gridSpacing = diameter / Math.ceil(Math.sqrt(count));
  
    // Place spheres in a grid pattern within the circular boundary
    for (let y = -radius; y <= radius; y += gridSpacing) {
      for (let x = -radius; x <= radius; x += gridSpacing) {
        if (positions.length >= count) break;
        const distanceFromCenter = Math.sqrt(x * x + y * y);
        if (distanceFromCenter + sphereRadius <= radius) {
          positions.push(new THREE.Vector3(x, y, 0));
        }
      }
      if (positions.length >= count) break;
    }
  
    return positions;
  };
  

