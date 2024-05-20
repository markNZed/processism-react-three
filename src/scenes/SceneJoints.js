import { Environment, OrbitControls, Sphere } from '@react-three/drei'
import { RigidBody, useSphericalJoint, Physics } from '@react-three/rapier'
import { forwardRef, useRef, createRef } from 'react'
import { Camera } from '../animationComponents'

const RopeSegment = forwardRef(({ position, component, type }, ref) => {
  return (
    <RigidBody colliders="ball" ref={ref} type={type} position={position}>
      {component}
    </RigidBody>
  )
})

/**
 * We can wrap our hook in a component in order to initiate
 * them conditionally and dynamically
 * a: Body A
 * b: Body B
 * c: Position-x of the joint in bodyA's local space
 * d: Position-x of the joint in bodyB's local space
 */
const RopeJoint = ({ a, b, c, d }) => {
  useSphericalJoint(a, b, [
    [c, 0, 0],
    [d, 0, 0]
  ])
  return null
}

const Rope = (props) => {
  const refs = useRef(Array.from({ length: props.length }).map(() => createRef()))
  const size = 0.5

  return (
    <group>
      {refs.current.map((ref, i) => (
        <RopeSegment
          ref={ref}
          key={i}
          position={[i * 0.1, i * 0.1, i * 0.1]}
          component={
            <Sphere args={[size]}>
              <meshStandardMaterial color={'#d9abff'} />
            </Sphere>
          }
          type="dynamic"
        />
      ))}

      {refs.current.map(
        (ref, i) =>
          i > 0 && (
            <>
              <RopeJoint a={refs.current[i]} b={refs.current[i - 1]} c={-size} d={size} key={i} />
              {/* Joining the last node with the first one to form a circle */}
              <RopeJoint a={refs.current[refs.current.length - 1]} b={refs.current[0]} c={size} d={-size} key={i} />
            </>
          )
      )}
    </group>
  )
}

const SceneJoints = () => {
  const cameraInitialState = {
    position: [0, 0, 35],
    zoom: 35,
    left: window.innerWidth / -2,
    right: window.innerWidth / 2,
    top: window.innerHeight / 2,
    bottom: window.innerHeight / -2,
    near: 0.1,
    far: 100
  }
  return (
    <>
      <Camera id={'camera'} initialState={cameraInitialState} />
      <Environment preset="sunset" />
      <OrbitControls />
      <Physics debug gravity={[0, 0, 0]}>
        <Rope length={21} />
      </Physics>
    </>
  )
}

export default SceneJoints
