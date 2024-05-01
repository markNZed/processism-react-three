import { Sphere, FatArrow, DynamicDoubleArrow } from './components';
import * as THREE from 'three'

export const createSphere = (id, position, delay) => (
    <>
        <Sphere id={"sphere1"} position={position} delay={delay} />
        <Sphere id={"sphere2"} position={new THREE.Vector3(position.x + 2, position.y, position.z)} delay={delay + 1000} />
        <Sphere id={"sphere3"} position={new THREE.Vector3(position.x, position.y - 2, position.z)} delay={delay + 4000} />
        <Sphere id={"sphere4"} position={new THREE.Vector3(position.x + 2, position.y - 2, position.z)} delay={delay + 4000} />
        <Sphere id={"sphere5"} position={new THREE.Vector3(position.x + 8, position.y, position.z)} delay={delay + 7000} />
        <Sphere id={"sphere6"} position={new THREE.Vector3(position.x + 10, position.y, position.z)} delay={delay + 7000} />
        <Sphere id={"sphere7"} position={new THREE.Vector3(position.x + 8, position.y - 2, position.z)} delay={delay + 7000} />
        <Sphere id={"sphere8"} position={new THREE.Vector3(position.x + 10, position.y - 2, position.z)} delay={delay + 7000} />
    </>
  );
  export const createArrowHorizontal = (id, delay, start, end) => (
    <>
      <DynamicDoubleArrow id={`${id}_1`} delay={delay} fromId={"sphere1"} toId={"sphere2"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay + 2000} fromId={"sphere3"} toId={"sphere4"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay + 5000} fromId={"sphere5"} toId={"sphere6"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay + 5000} fromId={"sphere7"} toId={"sphere8"} />
    </>
  );
  export const createArrowVertical = (id, delay, start, end) => (
    <>
      <DynamicDoubleArrow id={`${id}_1`} delay={delay} fromId={"sphere1"} toId={"sphere3"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay} fromId={"sphere2"} toId={"sphere4"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay + 3000} fromId={"sphere5"} toId={"sphere7"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay + 3000} fromId={"sphere6"} toId={"sphere8"} />
    </>
  );
  export const createArrowDiagonal = (id, delay, start, end) => (
    <>
      <DynamicDoubleArrow id={`${id}_1`} delay={delay} fromId={"sphere1"} toId={"sphere4"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay} fromId={"sphere2"} toId={"sphere3"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay + 3000} fromId={"sphere5"} toId={"sphere8"} />
      <DynamicDoubleArrow id={`${id}_2`} delay={delay + 3000} fromId={"sphere6"} toId={"sphere7"} />
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