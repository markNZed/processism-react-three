import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ArrowHelper } from 'three'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { useSpring, a } from '@react-spring/three';

export function Sphere({ id, delay, ...props }) {
  const ref = useRef()
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (visible) {
      const fadeInterval = setInterval(() => {
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0.1, 1))
      }, 200)
      return () => clearInterval(fadeInterval)
    }
  }, [visible])

  useFrame((state, delta) => (ref.current.rotation.x += delta))
  return (
    <a.mesh
      {...props}
      ref={ref}
      scale={clicked ? 0.75 : 0.5}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => (event.stopPropagation(), hover(true))}
      onPointerOut={(event) => hover(false)}
      visible={visible}
      material-opacity={opacity}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'blue'} opacity={0} transparent />
    </a.mesh>
  )
}

export function Circle({ id, delay, ...props }) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (visible) {
      const fadeInterval = setInterval(() => {
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0.1, 0.5))
      }, 200)
      return () => clearInterval(fadeInterval)
    }
  }, [visible])

  return (
    <a.mesh {...props} ref={ref} visible={visible} material-opacity={opacity}>
      <circleGeometry args={[3.5, 32, 32]} />
      <meshBasicMaterial color="green" opacity={0} transparent />
    </a.mesh>
  )
}



export function DoubleArrow({ id, from, to, delay }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    let fadeInterval;
    if (visible) {
      fadeInterval = setInterval(() => {
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0, 0.5));
      }, 200);
    }
    return () => clearInterval(fadeInterval);
  }, [visible]);

  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const inverseDirection = new THREE.Vector3().subVectors(from, to).normalize();

  return (
    <a.group visible={visible}>
      <Arrow from={from} to={to} direction={direction} opacity={opacity} />
      <Arrow from={to} to={from} direction={inverseDirection} opacity={opacity} />
    </a.group>
  );
}

export function Arrow  ({ id, from, to, delay })  {
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
export function MyText({ children, position, color = 'black', fontSize = 1, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(timer)
    }
  }, [visible])

  

  return visible ? (
    <Text position={position} color={color} fontSize={fontSize}>
      {children}
    </Text>
  ) : null
}

export function CameraController() {
  const { camera } = useThree()

  const [startMovement, setStartMovement] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartMovement(true);
    }, 11000); // delay in milliseconds

    return () => clearTimeout(timer);
  }, []);

  useFrame(({ clock }) => {
    if (startMovement) {
      const elapsedTime = clock.getElapsedTime();
      camera.position.y = Math.cos(elapsedTime) * 10;
      camera.position.z = Math.sin(elapsedTime) * -10;


      camera.lookAt(0, 0, 0);
    }
  });

  return null
}
