import { useEffect, useRef, useState } from 'react'
import {  useFrame, useThree, extend } from '@react-three/fiber'
import * as THREE from 'three'
import { ArrowHelper, DoubleSide } from 'three'
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
      <meshBasicMaterial color="green" opacity={0} transparent side={DoubleSide} />
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
      <FatArrow from={from} to={to} direction={direction} delay={delay} />
      <FatArrow from={to} to={from} direction={inverseDirection} delay={delay} />
    </a.group>
  );
}

// Extending React Three Fiber to include ArrowHelper
extend({ ArrowHelper });

export function Arrow({ id, from, to, delay }) {
  const arrowRef = useRef();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  useFrame(() => {
    if (visible && opacity < 1) {
      setOpacity((prevOpacity) => Math.min(prevOpacity + 0.01, 1));
      if (arrowRef.current) {
        arrowRef.current.line.material.opacity = opacity;
        arrowRef.current.cone.material.opacity = opacity;
        arrowRef.current.line.material.transparent = true;
        arrowRef.current.cone.material.transparent = true;
        arrowRef.current.line.material.needsUpdate = true;
        arrowRef.current.cone.material.needsUpdate = true;
      }
    }
  });
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  return visible ? (
    <arrowHelper
      ref={arrowRef}
      args={[direction, from, from.distanceTo(to), 'red']}
    />
  ) : null;
}

export function FatArrow({ from, to, delay, color = 'red', headLength = 0.2, headWidth = 0.15, lineWidth = 0.03, margin = 0.6 }) {
  const arrowGroup = useRef();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
  }, [delay]);

  useFrame(() => {
    if (visible && opacity < 1) {
        const newOpacity = Math.min(opacity + 0.01, 1);
        setOpacity(newOpacity);
        if (arrowGroup.current) {
            arrowGroup.current.children.forEach(child => {
                child.material.opacity = newOpacity;
                child.material.transparent = true;
                child.material.needsUpdate = true;
            });
        }
    }
  });

  useEffect(() => {
    if (!arrowGroup.current) return;

    if (visible) {
        const direction = new THREE.Vector3().subVectors(to, from).normalize();
        const adjustedFrom = from.clone().add(direction.clone().multiplyScalar(margin)); // Move 'from' point along the direction
        const adjustedTo = to.clone().sub(direction.clone().multiplyScalar(margin)); // Pull 'to' back by the margin
        const arrowLineLength = adjustedFrom.distanceTo(adjustedTo);

        const lineGeometry = new THREE.CylinderGeometry(lineWidth, lineWidth, arrowLineLength, 12);
        const lineMaterial = new THREE.MeshBasicMaterial({ color, opacity: 0, transparent: true });
        const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
        lineMesh.position.copy(adjustedFrom.clone().lerp(adjustedTo, 0.5));
        lineMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        arrowGroup.current.add(lineMesh);

        const coneGeometry = new THREE.ConeGeometry(headWidth, headLength, 12);
        const coneMaterial = new THREE.MeshBasicMaterial({ color, opacity: 0, transparent: true });
        const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
        coneMesh.position.copy(adjustedTo);
        coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        arrowGroup.current.add(coneMesh);
    } else {
        // Cleanup
        arrowGroup.current.children.forEach(child => {
            child.geometry.dispose();
            child.material.dispose();
            arrowGroup.current.remove(child);
        });
    }
  }, [visible, from, to, color, headLength, headWidth, lineWidth, margin]);

  return <group ref={arrowGroup} />;
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
