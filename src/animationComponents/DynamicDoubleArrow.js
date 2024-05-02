import { useEffect, useRef, useState, useContext } from 'react'
import {  useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import {  a } from '@react-spring/three';
import { useSpring, animated } from '@react-spring/three';
import useStore from '../useStore';
import {DoubleArrow } from './';

// Arrow component that dynamically positions itself based on sphere positions
function DynamicDoubleArrow({ id, fromId, toId, fromOffset, toOffset, ...props }) {
  const { positions } = useStore(state => ({ positions: state.positions }));
  const from = positions[fromId] ? positions[fromId].clone().add(fromOffset || new THREE.Vector3(0, 0, 0)) : null;
  const to = positions[toId] ? positions[toId].clone().add(toOffset || new THREE.Vector3(0, 0, 0)) : null;
  if (!from || !to) return null; // Don't render until positions are available
  return <DoubleArrow id={id} from={from} to={to} {...props} />
}

export default DynamicDoubleArrow;