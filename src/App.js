import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame,useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ArrowHelper } from 'three'
import * as THREE from 'three'
import { Text } from '@react-three/drei';




function Sphere({ id, delay, ...props }) {
  const ref = useRef()
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useFrame((state, delta) => (ref.current.rotation.x += delta))
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 0.75 : 0.5}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => (event.stopPropagation(), hover(true))}
      onPointerOut={(event) => hover(false)}
      visible={visible}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'blue'} />
    </mesh>
  )
}

function Circle({ id, delay, ...props }) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <mesh {...props} ref={ref} visible={visible}>
      <circleGeometry args={[3.5, 32, 32]} />
      <meshBasicMaterial color="green" 
      opacity={0.2} transparent />
    </mesh>
  )
}

const DoubleArrow = ({ id, from, to, delay }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const direction = new THREE.Vector3().subVectors(to, from).normalize()
  const inverseDirection = new THREE.Vector3().subVectors(from, to).normalize()

  return visible ? (
    <>
      <primitive object={new ArrowHelper(direction, from, from.distanceTo(to), 'red')} />
      <primitive object={new ArrowHelper(inverseDirection, to, from.distanceTo(to), 'red')} />
    </>
  ) : null
}


const Arrow = ({ id, from, to, delay }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const direction = new THREE.Vector3().subVectors(to, from).normalize()

  return visible ? (
    <>
      <primitive object={new ArrowHelper(direction, from, from.distanceTo(to), 'red')} />
    </>
  ) : null
}
function MyText({ children, position, color = 'black', fontSize = 1, delay = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return visible ? (
    <Text position={position} color={color} fontSize={fontSize}>
      {children}
    </Text>
  ) : null;
}


function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    const timer = setTimeout(() => {
      camera.position.set(0, 10, 0);
      camera.updateProjectionMatrix();
    }, 10000);

    return () => clearTimeout(timer);
  }, [camera]);

  return null;
}
export default function App() {
 

  return (
    <Canvas style={{ background: '#a8a7b5' }} camera={{ type: 'orthographic', position: [0, 0.5, 10] }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      
      <group position={[-1, 0, 0]}>
        <Sphere id="entity1" position={[-4, 2, 0]} delay={1000} />
        <MyText position={[-5, 3, 0]}  fontSize={1/2} delay={1500}>
        entity1
      </MyText>
        <MyText position={[-3, 3, 0]} fontSize={1/2} delay={4500}>
          relation
        </MyText>

        <Sphere id="entity2" position={[-2, 2, 0]} delay={2000} />
        <Sphere id="entity3" position={[-4, 0, 0]} delay={5000}  />
        <Sphere id="entity4" position={[-2, 0, 0]} delay={5000} />
        <DoubleArrow id="relation_arrow1" from={new THREE.Vector3(-2.5, 2, 0)} to={new THREE.Vector3(-3.5, 2, 0)} delay={4000} />
        <DoubleArrow id="relation_arrow2" from={new THREE.Vector3(-2, 0.5, 0)} to={new THREE.Vector3(-2, 1.5, 0)} delay={5000} />
        <DoubleArrow id="relation_arrow3" from={new THREE.Vector3(-4, 0.5, 0)} to={new THREE.Vector3(-4, 1.5, 0)} delay={5000} />
        <DoubleArrow id="relation_arrow4" from={new THREE.Vector3(-2.3, 0.4, 0)} to={new THREE.Vector3(-3.6, 1.7, 0)} delay={5000} />
        <DoubleArrow id="relation_arrow5" from={new THREE.Vector3(-3.5, 0.3, 0)} to={new THREE.Vector3(-2.4, 1.7, 0)} delay={5000} />
        <DoubleArrow id="relation_arrow6" from={new THREE.Vector3(-2.5, 0, 0)} to={new THREE.Vector3(-3.5, 0, 0)} delay={5000} />
        <Circle id="circle1" position={[-3.5, 1, -1.5]} delay={6000} />


        <Arrow from={new THREE.Vector3(-2, 0, -1.5)} to={new THREE.Vector3(-2, 0, -0.5)} delay={8000} />
        <Arrow from={new THREE.Vector3(-2, 2, -1.5)} to={new THREE.Vector3(-2, 2, -0.5)} delay={8000}/>
        <Arrow from={new THREE.Vector3(-4, 2, -1.5)} to={new THREE.Vector3(-4, 2, -0.5)} delay={8000} />
        <Arrow from={new THREE.Vector3(-4, 0, -1.5)} to={new THREE.Vector3(-4, 0, -0.5)} delay={8000}/>

      </group>

      <group position={[1, 0, 0]}>

        <Sphere id="entity1_1" position={[2, 0, 0]} delay={8000} />
        <Sphere id="entity1_2" position={[4, 2, 0]} delay={8000} />
        <Sphere id="entity1_3"position={[4, 0, 0]} delay={8000} />
        <Sphere id="entity1_4" position={[2, 2, 0]} delay={8000} />
        <DoubleArrow  id="relation_arrow1_1" from={new THREE.Vector3(2.3, 0.4, 0)} to={new THREE.Vector3(3.6, 1.7, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_2" from={new THREE.Vector3(2, 0.5, 0)} to={new THREE.Vector3(2, 1.5, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_3" from={new THREE.Vector3(4, 0.5, 0)} to={new THREE.Vector3(4, 1.5, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_4" from={new THREE.Vector3(3.5, 0.3, 0)} to={new THREE.Vector3(2.4, 1.7, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_5" from={new THREE.Vector3(2.5, 0, 0)} to={new THREE.Vector3(3.5, 0, 0)} delay={8000} />
        <DoubleArrow id="relation_arrow1_6" from={new THREE.Vector3(2.5, 2, 0)} to={new THREE.Vector3(3.5, 2, 0)} delay={8000} />
        <Circle id="circle1_1" position={[3.5, 1, -1.5]} delay={8000} />

        <Arrow from={new THREE.Vector3(2, 0, -.5)} to={new THREE.Vector3(2, 0, -1.5)}  delay={10000}/>
        <Arrow from={new THREE.Vector3(2, 2, -.5)} to={new THREE.Vector3(2, 2, -1.5)} delay={10000}/>
        <Arrow from={new THREE.Vector3(4, 2, -.5)} to={new THREE.Vector3(4, 2, -1.5)} delay={10000} /> 
        <Arrow from={new THREE.Vector3(4, 0, -.5)} to={new THREE.Vector3(4, 0, -1.5)} delay={10000}/>

       
      </group>  
      <CameraController />
      <DoubleArrow id="relation_arrow1_6" from={new THREE.Vector3(-1, 1, -1.5)} to={new THREE.Vector3(1, 1, -1.5)} delay={11000} />
    
      
      <OrbitControls />
    </Canvas>
  )
}