import { Sphere, FatArrow, DoubleArrow } from './components';
import * as THREE from 'three'

export const createSphere = (id, position, delay) => (
    <>
        <Sphere id={id} position={position} delay={delay} />
        <Sphere id={id} position={[position[0] +2, position[1] , position[2]]} delay={delay+ 1000} />
        <Sphere id={id} position={[position[0] , position[1] -2, position[2]]} delay={delay + 4000} />
        <Sphere id={id} position={[position[0] +2, position[1] -2, position[2]]} delay={delay + 4000} />
        <Sphere id={id} position={[position[0] +8, position[1] , position[2]]} delay={delay+ 7000} />
        <Sphere id={id} position={[position[0] +10, position[1] , position[2]]} delay={delay+ 7000} />
        <Sphere id={id} position={[position[0] +8, position[1] -2, position[2]]} delay={delay + 7000} />
        <Sphere id={id} position={[position[0] +10, position[1] -2, position[2]]} delay={delay + 7000} />    
    </>
  );
  export const createArrowHorizontal = (id, delay, start, end) => (
    <>
      <DoubleArrow id={id} delay={delay} from={start} to={end} />
      <DoubleArrow id={id} delay={delay + 2000} from={new THREE.Vector3(start.x, 0, start.z)} to={new THREE.Vector3(end.x, 0, end.z)} />
      <DoubleArrow id={id} delay={delay + 5000} from={new THREE.Vector3(-start.x + 2, 2, start.z)} to={new THREE.Vector3(-end.x + 2, 2, end.z)} />
      <DoubleArrow id={id} delay={delay + 5000} from={new THREE.Vector3(-start.x + 2, 0, start.z)} to={new THREE.Vector3(-end.x + 2, 0, end.z)} />
    </>
  );
  export const createArrowVertical = (id, delay, start, end) => (
    <>
      <DoubleArrow id={`${id}_1`} delay={delay} from={start} to={end} />
      <DoubleArrow id={`${id}_2`} delay={delay} from={new THREE.Vector3(start.x + 2, start.y, start.z)} to={new THREE.Vector3(end.x + 2, end.y, end.z)} />
      <DoubleArrow id={`${id}_3`} delay={delay + 3000} from={new THREE.Vector3(-start.x, start.y, start.z)} to={new THREE.Vector3(-end.x, end.y, end.z)} />
      <DoubleArrow id={`${id}_4`} delay={delay + 3000} from={new THREE.Vector3(-start.x + 2, start.y, start.z)} to={new THREE.Vector3(-end.x + 2, end.y, end.z)} />
    </>
  );
  export const createArrowDiagonal = (id, delay, start, end) => (
    <>
      <DoubleArrow id={`${id}_1`} delay={delay} from={start} to={end} />
      <DoubleArrow id={`${id}_2`} delay={delay} from={new THREE.Vector3(start.x - 2, start.y, start.z)} to={new THREE.Vector3(end.x + 2, end.y, end.z)} />
      <DoubleArrow id={`${id}_3`} delay={delay + 3000} from={new THREE.Vector3(-start.x + 2, start.y, start.z)} to={new THREE.Vector3(-end.x + 2, end.y, end.z)} />
      <DoubleArrow id={`${id}_4`} delay={delay + 3000} from={new THREE.Vector3(-start.x + 4, start.y, start.z)} to={new THREE.Vector3(-end.x, end.y, end.z)} />
    </>
  );
  export const createBottomUpTopDown = (id, delay, start, end) => (
    <>
      <FatArrow id={`${id}_1`} delay={delay} from={start} to={end} />
      <FatArrow id={`${id}_1`} delay={delay} from={new THREE.Vector3(start.x + 2, start.y, start.z)} to={new THREE.Vector3(end.x + 2, end.y, end.z)} />
      <FatArrow id={`${id}_1`} delay={delay} from={new THREE.Vector3(start.x + 2, start.y + 2, start.z)} to={new THREE.Vector3(end.x + 2, end.y + 2, end.z)} />
      <FatArrow id={`${id}_1`} delay={delay} from={new THREE.Vector3(start.x, start.y + 2, start.z)} to={new THREE.Vector3(end.x, end.y + 2, end.z)} />

      <FatArrow id={`${id}_1`} delay={delay} from={new THREE.Vector3(-end.x, end.y, end.z)} to={new THREE.Vector3(-start.x, start.y, start.z)} />
      <FatArrow id={`${id}_1`} delay={delay} from={new THREE.Vector3(-end.x - 2, end.y, end.z)} to={new THREE.Vector3(-start.x - 2, start.y, start.z)} />
      <FatArrow id={`${id}_1`} delay={delay} from={new THREE.Vector3(-end.x, end.y + 2, end.z)} to={new THREE.Vector3(-start.x, start.y + 2, start.z)} />
      <FatArrow id={`${id}_1`} delay={delay} from={new THREE.Vector3(-end.x - 2, end.y + 2, end.z)} to={new THREE.Vector3(-start.x - 2, start.y + 2, start.z)} />
    </>
  );