import { Sphere,Circle,DoubleArrow,Arrow,MyText,CameraController } from './components';
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export default function App() {
  return (
    <Canvas style={{ background: '#a8a7b5' }} camera={{ type: 'orthographic', position: [0, 0.5, 10] }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <group position={[-1, 0, 0]}>
        <Sphere id="entity1" position={[-4, 2, 0]} delay={1000} />
        <MyText position={[-5, 3, 0]} fontSize={1 / 2} delay={1500}>
          entity1
        </MyText>
        <MyText position={[-3, 3, 0]} fontSize={1 / 2} delay={4500}>
          relation
        </MyText>

        <Sphere id="entity2" position={[-2, 2, 0]} delay={2000} />
        <Sphere id="entity3" position={[-4, 0, 0]} delay={5000} />
        <Sphere id="entity4" position={[-2, 0, 0]} delay={5000} />
        <DoubleArrow id="relation_arrow1" from={new THREE.Vector3(-2.5, 2, 0)} to={new THREE.Vector3(-3.5, 2, 0)} delay={4000} />
        <DoubleArrow id="relation_arrow2" from={new THREE.Vector3(-2, 0.5, 0)} to={new THREE.Vector3(-2, 1.5, 0)} delay={5000} />
        <DoubleArrow id="relation_arrow3" from={new THREE.Vector3(-4, 0.5, 0)} to={new THREE.Vector3(-4, 1.5, 0)} delay={5000} />
        <DoubleArrow id="relation_arrow4" from={new THREE.Vector3(-2.3, 0.4, 0)} to={new THREE.Vector3(-3.6, 1.7, 0)} delay={5000} />
        <DoubleArrow id="relation_arrow5" from={new THREE.Vector3(-3.5, 0.3, 0)} to={new THREE.Vector3(-2.4, 1.7, 0)} delay={5000} />
        <DoubleArrow id="relation_arrow6" from={new THREE.Vector3(-2.5, 0, 0)} to={new THREE.Vector3(-3.5, 0, 0)} delay={5000} />
        <Circle id="circle1" position={[-3.5, 1, -1.5]} delay={6000} />

        <Arrow from={new THREE.Vector3(-2, 0, -1.5)} to={new THREE.Vector3(-2, 0, -0.5)} delay={8000} />
        <Arrow from={new THREE.Vector3(-2, 2, -1.5)} to={new THREE.Vector3(-2, 2, -0.5)} delay={8000} />
        <Arrow from={new THREE.Vector3(-4, 2, -1.5)} to={new THREE.Vector3(-4, 2, -0.5)} delay={8000} />
        <Arrow from={new THREE.Vector3(-4, 0, -1.5)} to={new THREE.Vector3(-4, 0, -0.5)} delay={8000} />
      </group>

      <group position={[1, 0, 0]}>
        <Sphere id="entity1_1" position={[2, 0, 0]} delay={8000} />
        <Sphere id="entity1_2" position={[4, 2, 0]} delay={8000} />
        <Sphere id="entity1_3" position={[4, 0, 0]} delay={8000} />
        <Sphere id="entity1_4" position={[2, 2, 0]} delay={8000} />
        <DoubleArrow id="relation_arrow1_1" from={new THREE.Vector3(2.3, 0.4, 0)} to={new THREE.Vector3(3.6, 1.7, 0)} delay={8000}  />
        <DoubleArrow id="relation_arrow1_2" from={new THREE.Vector3(2, 0.5, 0)} to={new THREE.Vector3(2, 1.5, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_3" from={new THREE.Vector3(4, 0.5, 0)} to={new THREE.Vector3(4, 1.5, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_4" from={new THREE.Vector3(3.5, 0.3, 0)} to={new THREE.Vector3(2.4, 1.7, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_5" from={new THREE.Vector3(2.5, 0, 0)} to={new THREE.Vector3(3.5, 0, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_6" from={new THREE.Vector3(2.5, 2, 0)} to={new THREE.Vector3(3.5, 2, 0)} delay={8000} />
        <Circle id="circle1_1" position={[3.5, 1, -1.5]} delay={8000} />

        <Arrow from={new THREE.Vector3(2, 0, -0.5)} to={new THREE.Vector3(2, 0, -1.5)} delay={10000} />
        <Arrow from={new THREE.Vector3(2, 2, -0.5)} to={new THREE.Vector3(2, 2, -1.5)} delay={10000} />
        <Arrow from={new THREE.Vector3(4, 2, -0.5)} to={new THREE.Vector3(4, 2, -1.5)} delay={10000} />
        <Arrow from={new THREE.Vector3(4, 0, -0.5)} to={new THREE.Vector3(4, 0, -1.5)} delay={10000} />
      </group>
      <CameraController />
      <DoubleArrow id="relation_arrow1_6" from={new THREE.Vector3(-1, 1, -1.5)} to={new THREE.Vector3(1, 1, -1.5)} delay={11000} />
    
      <OrbitControls />
    </Canvas>
  )
}
