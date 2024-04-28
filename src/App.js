import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ArrowHelper } from 'three';

import * as THREE from 'three';

function Sphere(props) {
  const ref = useRef();
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  useFrame((state, delta) => (ref.current.rotation.x += delta));
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 0.75 : 0.5}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => (event.stopPropagation(), hover(true))}
      onPointerOut={(event) => hover(false)}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'blue'} />
    </mesh>
  );
}
// function for big green circle with opacity = 0,5
function Circle(props) {
  const ref = useRef();
  return (
    <mesh {...props} ref={ref}>
      <circleGeometry args={[2.5, 32,32]} />
      <meshBasicMaterial color="green" opacity={0.2} transparent />
    </mesh>
  );
}

const DoubleArrow = ({ from, to }) => {
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const inverseDirection = new THREE.Vector3().subVectors(from, to).normalize();

  return (
    <>
      <primitive object={new ArrowHelper(direction, from, from.distanceTo(to), 'red')} />
      <primitive object={new ArrowHelper(inverseDirection, to, from.distanceTo(to), 'red')} />
    </>
  );
};

  
function Arrow({ from, to }) {

  const arrowRef = useRef();

  useFrame(() => {
    const direction = new THREE.Vector3().subVectors(to, from);
    arrowRef.current.setDirection(direction.normalize());
    arrowRef.current.position.copy(from);
  });

  return <arrowHelper ref={arrowRef} args={[new THREE.Vector3(0, 1, 0), '#02e847']} />;
}

export default function App() {
  return (
    <Canvas style={{ background: '#a8a7b5' }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <Sphere position={[-2, 0, 0]} />
      <Sphere position={[-2, 2, 0]} />
      <Sphere position={[-4, 2, 0]} />
      <Sphere position={[-4, 0, 0]} />
      <Sphere position={[2, 0, 0]} />
      <Sphere position={[4, 2, 0]} />
      <Sphere position={[4, 0, 0]} />
      <Sphere position={[2, 2, 0]} />
      {/* Add Arrow between spheres */}
      <DoubleArrow from={new THREE.Vector3(-2, .5,0)} to={new THREE.Vector3(-2, 1.5, 0)} />
      <DoubleArrow from={new THREE.Vector3(-4, .5,0)} to={new THREE.Vector3(-4, 1.5, 0)} />

      <DoubleArrow from={new THREE.Vector3(2, .5,0)} to={new THREE.Vector3(2, 1.5, 0)} />
      <DoubleArrow from={new THREE.Vector3(4, .5,0)} to={new THREE.Vector3(4, 1.5, 0)} />

      <DoubleArrow from={new THREE.Vector3(3.5, .3,0)} to={new THREE.Vector3(2.4  , 1.7 , 0)} />
      <DoubleArrow from={new THREE.Vector3(-3.5, .3,0)} to={new THREE.Vector3(-2.4, 1.7 , 0)} />

      <DoubleArrow from={new THREE.Vector3(-2.3, .4,0)} to={new THREE.Vector3(-3.6    , 1.7 , 0)} />
      <DoubleArrow from={new THREE.Vector3(2.3, .4,0)} to={new THREE.Vector3(3.6, 1.7 , 0)} />

      <DoubleArrow from={new THREE.Vector3(2.5, 0,0)} to={new THREE.Vector3(3.5, 0, 0)} />
      <DoubleArrow from={new THREE.Vector3(-2.5, 0,0)} to={new THREE.Vector3(-3.5, 0, 0)} />

      <DoubleArrow from={new THREE.Vector3(2.5, 2,0)} to={new THREE.Vector3(3.5, 2, 0)} />
      <DoubleArrow from={new THREE.Vector3(-2.5, 2,0)} to={new THREE.Vector3(-3.5, 2, 0)} />  

      <Circle position={[3, 1, -1.5]} />
      <Circle position={[-3, 1, -1.5]} />

      <OrbitControls />
    </Canvas>
  );
}
