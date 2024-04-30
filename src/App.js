import {CustomArrowHorizontal, Circle } from './components';
import { createSphere, createArrowHorizontal, createArrowVertical, createArrowDiagonal, createBottomUpTopDown } from './Animation_center';
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'


export default function App() {
  return (
    <Canvas style={{ background: '#a8a7b5' }} camera={{ type: 'orthographic', position: [0, 0.5, 10] }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <group position={[-1, 0, 0]}>
        {createSphere("entity1", [-4, 2, 0], 1000)}
        {/* {createSphere("entity2", [-2, 2, 0], 2000)}

        
        {createSphere("entity3", [-4, 0, 0], 5000)}
        {createSphere("entity4", [-2, 0, 0], 5000)} */}
        <Circle id="circle1" position={[-3, 1, -1.5]} delay={6000} />

        {createArrowHorizontal("arrow1 and arrow4", 3000, [-4, 2, 0], [-2, 2, 0])}
        {createArrowVertical("arrow2 and arrow3", 5000, [-4, 0.5, 0], [-4, 1.5, 0])}
        {createArrowDiagonal("arrow5", 5000, [-2, 0, 0], [-4, 2, 0])}
        {/* ... */}
      </group>

      <group position={[1, 0, 0]}>


        

        <Circle id="circle1_1" position={[3, 1, -1.5]} delay={8000} />
        {/* ... */}
      </group>

      <CustomArrowHorizontal id="arrow5" delay={11000} start={[-1, 1, -1.5]} end={[1, 1, -1.5]} />

      {createBottomUpTopDown("arrow6", 8000, [4, 0, -0.5], [4, 0, -1.5])}
      <OrbitControls />
    </Canvas>
  )
}