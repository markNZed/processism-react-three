import { useEffect, useRef, useState } from 'react'
import {  useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import {  a } from '@react-spring/three';

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
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0.07, 1))
      }, 300)
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
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0.07, 0.5))
      }, 300)
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

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const inverseDirection = new THREE.Vector3().subVectors(from, to).normalize();

  return (
    <a.group visible={visible}>
      <Arrow from={from} to={to} direction={direction}  />
      <Arrow from={to} to={from} direction={inverseDirection}  />
    </a.group>
  );
}
export function Arrow({ id, from, to, delay }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  useFrame(() => {
    if (visible && opacity < 1) {
      setOpacity((prevOpacity) => Math.min(prevOpacity + 0.05, 1));
    }
  });
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  return visible ? (
    <primitive object={new THREE.ArrowHelper(direction, from, from.distanceTo(to), 'red')} opacity={opacity} />
  ) : null;
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
      if (camera.position.y == 10 && camera.position.z == 0) {
        setStartMovement(false);
      }
      camera.lookAt(0, 0, 0);
    }
  });
  return null
}
import { Vector3 } from 'three';
export function CustomArrowHorizontal({ id, delay, start, end, ...props }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (visible) {
      const fadeInterval = setInterval(() => {
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0.07, 1))
      }, 300)
      return () => clearInterval(fadeInterval)
    }
  }, [visible])
  // Calculate position and rotation
  const startPos = new Vector3(...start);
  const endPos = new Vector3(...end);
  const position = new Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const direction = new Vector3().subVectors(endPos, startPos);
  const rotation = new Vector3(
    Math.PI / 4, // Rotated 45 degrees around y-axis to make it horizontal
    Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
    Math.atan2(direction.x, direction.z),
  );
  return (
    <a.group {...props} ref={ref} visible={visible} position={position.toArray()} rotation={rotation.toArray()}>
      <a.mesh material-opacity={opacity}>
        <cylinderGeometry args={[0.04, 0.04, direction.length()/5, 32]} />
        <meshBasicMaterial color="red" opacity={0} transparent />
      </a.mesh>
      <a.mesh position={[0, direction.length()/6.65, 0]} material-opacity={opacity}>
        <coneGeometry args={[0.08, 0.2, 32]} />
        <meshBasicMaterial color="GREEN" opacity={0}  transparent/>
      </a.mesh>
      <a.mesh position={[0, -direction.length()/6.65, 0]} material-opacity={opacity}>
        <coneGeometry args={[0.08, -0.2, 32]} />
        <meshBasicMaterial color="GREEN" opacity={0} transparent />
      </a.mesh>
    </a.group>
  );
}
export function CustomArrowVertical({ id, delay, start, end, ...props }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  useEffect(() => {
    if (visible) {
      const fadeInterval = setInterval(() => {
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0.07, 1));
      }, 300);
      return () => clearInterval(fadeInterval);
    }
  }, [visible]);
  // Calculate position and rotation
  const startPos = new Vector3(...start);
  const endPos = new Vector3(...end);
  const position = new Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const direction = new Vector3().subVectors(endPos, startPos);
  const coney = startPos
  return (
    <a.group {...props} ref={ref} visible={visible} position={position.toArray()} >
      <a.mesh material-opacity={opacity}>
        <cylinderGeometry args={[0.04, 0.04, direction.length()/2, 32]} />
        <meshBasicMaterial color="red" opacity={0}  transparent/>
      </a.mesh>
      <a.mesh position={[0, direction.length()/3, 0]} material-opacity={opacity}>
        <coneGeometry args={[0.08, 0.2, 32]} />
        <meshBasicMaterial color="GREEN" opacity={0} transparent />
      </a.mesh>
      <a.mesh position={[0, -direction.length()/3 , 0]} material-opacity={opacity}>
        <coneGeometry args={[0.08, -0.2, 32]} />
        <meshBasicMaterial color="GREEN" opacity={0} transparent />
      </a.mesh>
    </a.group>
  );
}
export function CustomArrowDiagonal({ id, delay, start, end,type, ...props }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (visible) {
      const fadeInterval = setInterval(() => {
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0.07, 1));
      }, 300);
      return () => clearInterval(fadeInterval);
    }
  }, [visible]);
// Calculate position and rotation
const startPos = new Vector3(...start);
const endPos = new Vector3(...end);
const position = new Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
const direction = new Vector3().subVectors(endPos, startPos);
const coney = 0.5
let rotation;
if(type === "diagonal"){
 rotation = new Vector3(
  Math.PI / 2, // Rotated 90 degrees around y-axis to make it horizontal
  Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
  Math.atan2(direction.x, direction.z),
);
}
else if (type === 'diagonal2') {
   rotation = new Vector3(
    Math.PI / -2, // Rotated 90 degrees around y-axis to make it horizontal
    Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
    Math.atan2(direction.x, direction.z),
  );
}
return (
  <a.group {...props} ref={ref} visible={visible} position={position.toArray()} rotation={rotation.toArray()}>
    <a.mesh material-opacity={opacity}>
      <cylinderGeometry args={[0.04, 0.04, direction.length()/2, 32]} />
      <meshBasicMaterial color="red" opacity={0}  transparent/>
    </a.mesh>
    <a.mesh position={[0, direction.length()/3.5, 0]} material-opacity={opacity}>
      <coneGeometry args={[0.08, 0.2, 32]} />
      <meshBasicMaterial color="GREEN" opacity={0} transparent />
    </a.mesh>
    <a.mesh position={[0, -direction.length()/3.5, 0]} material-opacity={opacity}>
      <coneGeometry args={[0.08, -0.2, 32]} />
      <meshBasicMaterial color="GREEN" opacity={0} transparent />
    </a.mesh>
  </a.group>
);
}
export function CustomArrowTopUPbottomDown({ id, delay, start, end,type, ...props }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  useEffect(() => {
    if (visible) {
      const fadeInterval = setInterval(() => {
        setOpacity((prevOpacity) => Math.min(prevOpacity + 0.07, 1));
      }, 300);
      return () => clearInterval(fadeInterval);
    }
  }, [visible]);
// Calculate position and rotation
const startPos = new Vector3(...start);
const endPos = new Vector3(...end);
const position = new Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
const direction = new Vector3().subVectors(endPos, startPos);
let cone
let rotation;
if(type === "top_DOWN"){
 rotation = new Vector3(
  Math.PI /2, // Rotated 90 degrees around y-axis to make it horizontal
  Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
  Math.atan2(direction.x, direction.z),
);
 cone = direction.length()/3
}
else if (type === 'Bottom_UP') {
   rotation = new Vector3(
    Math.PI / -2, // Rotated 90 degrees around y-axis to make it horizontal
    Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
    Math.atan2(direction.x, direction.z),
  );
  cone = direction.length()/3
}
return (
  <a.group {...props} ref={ref} visible={visible} position={position.toArray()} rotation={rotation.toArray()}>
    <a.mesh material-opacity={opacity}>
      <cylinderGeometry args={[0.04, 0.04, direction.length()/1.5, 32]} />
      <meshBasicMaterial color="red" opacity={0}  transparent/>
    </a.mesh>
    <a.mesh position={[0, cone, 0]} material-opacity={opacity}>
      <coneGeometry args={[0.08, 0.2, 32]} />
      <meshBasicMaterial color="GREEN" opacity={0} transparent />
    </a.mesh>
  </a.group>
);
}