import { useEffect, useRef, useState, useContext } from 'react'
import {  useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import {  a } from '@react-spring/three';
import { useSpring, animated } from '@react-spring/three';
import useStore from '../useStore';
import {FatArrow} from './';

function DoubleArrow({ id, from, to }) {

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

export default DoubleArrow;