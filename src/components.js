import { useEffect, useRef, useState, useContext } from 'react'
import {  useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import {  a } from '@react-spring/three';
import { useSpring, animated } from '@react-spring/three';
import useStore from './useStore';

export function EmergentEntity({ id, initialPosition, causation, ...props }) {

  const ref = useRef()
  const { positions, updatePosition } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition
  }));

  // Set initial position
  useEffect(() => {
    if (ref.current) {
        ref.current.position.copy(initialPosition|| new THREE.Vector3(0, 0, 0));
        const newPosition = initialPosition || new THREE.Vector3(0, 0, 0);
        //console.log("newPosition", newPosition)
        if (!positions[id] || !newPosition.equals(positions[id])) {
          updatePosition(id, newPosition);
        }
    }
}, [initialPosition]);

  // Update global state whenever the position changes
  useFrame(() => {
    if (ref.current && positions[id]) {
      if (!ref.current.position.equals(positions[id])) {
        updatePosition(id, ref.current.position.clone());
      }
    }
  });

  const firstSpherePosition = new THREE.Vector3(initialPosition.x - 5, initialPosition.y + 2, initialPosition.z - 2)
  const causationPosition = new THREE.Vector3(initialPosition.x - 5, initialPosition.y, initialPosition.z - 2)

  const causationArrows = (id, start, end) => (
    <>
      <FatArrow id={`${id}_causation1`} from={start} to={end} />
      <FatArrow id={`${id}_causation2`} from={new THREE.Vector3(start.x + 2, start.y, start.z)} to={new THREE.Vector3(end.x + 2, end.y, end.z)} />
      <FatArrow id={`${id}_causation3`} from={new THREE.Vector3(start.x + 2, start.y + 2, start.z)} to={new THREE.Vector3(end.x + 2, end.y + 2, end.z)} />
      <FatArrow id={`${id}_causation4`} from={new THREE.Vector3(start.x, start.y + 2, start.z)} to={new THREE.Vector3(end.x, end.y + 2, end.z)} />
    </>
  );

  return (
    <group ref={ref} initialPosition={initialPosition}>
      <Circle id={`${id}.boundary`} initialPosition={new THREE.Vector3(initialPosition.x - 4, initialPosition.y + 1, initialPosition.z)} />
      <Sphere id={`${id}.sphere1`} initialPosition={firstSpherePosition} radius={0.5}/>
      <Sphere id={`${id}.sphere2`} initialPosition={new THREE.Vector3(firstSpherePosition.x + 2, firstSpherePosition.y, firstSpherePosition.z)} radius={0.5} />
      <Sphere id={`${id}.sphere3`} initialPosition={new THREE.Vector3(firstSpherePosition.x, firstSpherePosition.y - 2, firstSpherePosition.z)} radius={0.5} />
      <Sphere id={`${id}.sphere4`} initialPosition={new THREE.Vector3(firstSpherePosition.x + 2, firstSpherePosition.y - 2, firstSpherePosition.z)} radius={0.5} />
      <DynamicDoubleArrow id={`${id}_1`} fromId={`${id}.sphere1`} toId={`${id}.sphere2`} />
      <DynamicDoubleArrow id={`${id}_2`} fromId={`${id}.sphere3`} toId={`${id}.sphere4`} />
      <DynamicDoubleArrow id={`${id}_1`} fromId={`${id}.sphere1`} toId={`${id}.sphere3`} />
      <DynamicDoubleArrow id={`${id}_2`} fromId={`${id}.sphere2`} toId={`${id}.sphere4`} />
      <DynamicDoubleArrow id={`${id}_1`} fromId={`${id}.sphere1`} toId={`${id}.sphere4`} />
      <DynamicDoubleArrow id={`${id}_2`} fromId={`${id}.sphere2`} toId={`${id}.sphere3`} />
       {
        causation === "bottomup" ?
        causationArrows(`${id}_bottomup`, causationPosition, new THREE.Vector3(causationPosition.x, causationPosition.y, causationPosition.z + 2.5)) :
        causationArrows(`${id}_bottomup`, new THREE.Vector3(causationPosition.x, causationPosition.y, causationPosition.z + 2.5), causationPosition)
      }
    </group>
  );
};

export function Sphere({ id, initialPosition, radius = 0.5, finalOpacity = 1.0, ...props }) {
  const ref = useRef()
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)

  const { positions, updatePosition, animationState } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition,
    animationState: state.animationStates[id]
  }));

  const animationControl = animationState || { scale: 1 }; // Default or fallback state

  // Set initial position
  useEffect(() => {
      if (ref.current) {
          ref.current.position.copy(initialPosition|| new THREE.Vector3(0, 0, 0));
          const newPosition = initialPosition || new THREE.Vector3(0, 0, 0);
          if (!positions[id] || !newPosition.equals(positions[id])) {
              updatePosition(id, newPosition);
          }
      }
  }, [initialPosition]);

  // Update global state whenever the position changes
  useFrame(() => {
    if (ref.current && positions[id]) {
      if (!ref.current.position.equals(positions[id])) {
        updatePosition(id, initialPosition|| new THREE.Vector3(0, 0, 0));
      }
    }
  });

  // Extracting values from animationControl with default values
  const { visible = true, opacity = 1, fadeInDuration = 2000} = animationControl || {};

  useFrame(() => {
    if (ref.current) {
      const newPosition = ref.current.position.clone();
      updatePosition(id, newPosition);
    }
  });

  // React Spring animation for opacity
  const springProps = useSpring({
    to: { opacity: visible ? opacity : 0 },  // Animate to 'opacity' if visible, otherwise animate to 0
    from: { opacity: 0 },                   // Start from fully transparent
    config: { duration: fadeInDuration }
  });

  return (
    <a.mesh
      {...props}
      ref={ref}
      scale={clicked ? animationControl.scale * 2 : animationControl.scale}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => (event.stopPropagation(), hover(true))}
      onPointerOut={(event) => hover(false)}
      visible={visible}
      material-opacity={opacity}
      depthWrite={false} // crucial for correct rendering of inner objects
      >
      <sphereGeometry args={[radius, 32, 32]} />
      <animated.meshStandardMaterial color={hovered ? 'hotpink' : 'blue'} opacity={springProps.opacity} transparent />
    </a.mesh>
  )
}

export function Circle({ id, initialPosition, ...props }) {
  const ref = useRef()

  const { positions, updatePosition, animationState } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition,
    animationState: state.animationStates[id] || { visible: true, opacity: 0.5, fadeInDuration: 1000 } // Provide default values
  }));

  // Set initial position
  useEffect(() => {
      if (ref.current) {
          ref.current.position.copy(initialPosition|| new THREE.Vector3(0, 0, 0));
          const newPosition = initialPosition || new THREE.Vector3(0, 0, 0);
          if (!positions[id] || !newPosition.equals(positions[id])) {
              updatePosition(id, newPosition);
          }
      }
  }, [initialPosition]);

  // Update global state whenever the position changes
  useFrame(() => {
      if (ref.current && positions[id]) {
        //console.log("positions[id]", positions[id], ref.current.position)
        if (!ref.current.position.equals(positions[id])) {
          updatePosition(id, ref.current.position.clone());
        }
      }
  });

  // Extracting values from animationControl with default values
  const { visible = true, opacity = 0.5, fadeInDuration = 1000} = animationState || {};

  // React Spring animation for opacity
  const springProps = useSpring({
    to: { opacity: visible ? opacity : 0 },  // Animate to 'opacity' if visible, otherwise animate to 0
    from: { opacity: 0 },                   // Start from fully transparent
    config: { duration: fadeInDuration }
  });

  return (
    <a.mesh {...props} ref={ref} visible={true}>
      <circleGeometry args={[3.5, 32, 32]} />
      <animated.meshBasicMaterial color="green" transparent opacity={springProps.opacity} side={DoubleSide} />
    </a.mesh>
  );
}

export function DoubleArrow({ id, from, to }) {

  const { positions, updatePosition, animationState } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition,
    animationState: state.animationStates[id]
  }));

  const { visible = true } = animationState || {};

  return (
    <a.group visible={visible}>
      <FatArrow id={`${id}.from`} from={from} to={to} />
      <FatArrow id={`${id}.to`} from={to} to={from} />
    </a.group>
  );
}

// Arrow component that dynamically positions itself based on sphere positions
export function DynamicDoubleArrow({ id, fromId, toId, fromOffset, toOffset, ...props }) {
  const { positions } = useStore(state => ({ positions: state.positions }));
  const from = positions[fromId] ? positions[fromId].clone().add(fromOffset || new THREE.Vector3(0, 0, 0)) : null;
  const to = positions[toId] ? positions[toId].clone().add(toOffset || new THREE.Vector3(0, 0, 0)) : null;
  if (!from || !to) return null; // Don't render until positions are available
  return <DoubleArrow id={id} from={from} to={to} {...props} />
}

export function FatArrow({ id, from, to, color = 'red', headLength = 0.2, headWidth = 0.15, lineWidth = 0.03, margin = 0.6 }) {
  const ref = useRef();
  const [opacity, setOpacity] = useState(0);

  const { positions, updatePosition, animationState } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition,
    animationState: state.animationStates[id] || {}
  }));

  // Update global state whenever the position changes
  useFrame(() => {
      if (ref.current && positions[id]) {
        //console.log("positions[id]", positions[id], ref.current.position)
        if (!ref.current.position.equals(positions[id])) {
          updatePosition(id, ref.current.position.clone());
        }
      }
  });

  // Extracting values from animationControl with default values
  const { visible = true, fadeInDuration = 1000} = animationState || {};

  useFrame(() => {
    if (visible && opacity < 1) {
        const newOpacity = Math.min(opacity + 0.01, 1);
        setOpacity(newOpacity);
        if (ref.current) {
            ref.current.children.forEach(child => {
                child.material.opacity = newOpacity;
                child.material.transparent = true;
                child.material.needsUpdate = true;
            });
        }
    }
  });

  useEffect(() => {
    if (!ref.current) return;

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
        ref.current.add(lineMesh);

        const coneGeometry = new THREE.ConeGeometry(headWidth, headLength, 12);
        const coneMaterial = new THREE.MeshBasicMaterial({ color, opacity: 0, transparent: true });
        const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
        coneMesh.position.copy(adjustedTo);
        coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        ref.current.add(coneMesh);
    } else {
        // Cleanup
        ref.current.children.forEach(child => {
            child.geometry.dispose();
            child.material.dispose();
            ref.current.remove(child);
        });
    }
  }, [visible, from, to, color, headLength, headWidth, lineWidth, margin]);

  return <group ref={ref} />;
}