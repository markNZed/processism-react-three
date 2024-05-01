import React, { useState, createContext } from 'react';
import {DoubleArrow, Circle } from './components';
import { createSphere, createArrowHorizontal, createArrowVertical, createArrowDiagonal, createBottomUpTopDown } from './Animation_center';
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { PositionProvider } from './PositionContext'; // Adjust the path as necessary

export default function App() {
  return (
    <Canvas style={{ background: '#a8a7b5' }} camera={{ type: 'orthographic', position: [0, 0.5, 10] }}>
      <PositionProvider>
        <ambientLight intensity={Math.PI / 2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        <group position={[-1, 0, 0]}>
          {createSphere("entity1", new THREE.Vector3(-4, 2, 0), 1000)}
          <Circle id="circle1" position={[-3, 1, -1.5]} delay={6000} />
          {createArrowHorizontal("arrow1 and arrow4", 3000, new THREE.Vector3(-2, 2, 0), new THREE.Vector3(-4, 2, 0))}
          {createArrowVertical("arrow2 and arrow3", 5000, new THREE.Vector3(-4, 0, 0), new THREE.Vector3(-4, 2, 0))}
          {createArrowDiagonal("arrow5 and arrow6", 5000, new THREE.Vector3(-2, 0, 0), new THREE.Vector3(-4, 2, 0))}
        </group>
        <group position={[1, 0, 0]}>
          <Circle id="circle1_1" position={[3, 1, -1.5]} delay={8000} />
        </group>

        <DoubleArrow id="arrow7" delay={11000} from={new THREE.Vector3(-1, 1, -1.5)} to={new THREE.Vector3(1, 1, -1.5)} />
        {/* <CustomArrowHorizontal id="arrow5" delay={11000} start={[-1, 1, -1.5]} end={[1, 1, -1.5]} /> */}

        {createBottomUpTopDown("arrow8 and arrow 9", 8000, new THREE.Vector3(3, 0, 0), new THREE.Vector3(3, 0, -2))}

        <OrbitControls />
      </PositionProvider>
    </Canvas>
  )
}