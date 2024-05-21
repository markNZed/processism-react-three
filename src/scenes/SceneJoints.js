import { Environment, OrbitControls, Circle } from '@react-three/drei'
import { RigidBody, useSphericalJoint, Physics } from '@react-three/rapier'
import { forwardRef, useRef, createRef } from 'react'
import { Camera } from '../animationComponents'
import { Color } from 'three'

const RopeSegment = forwardRef(({ component, position }, ref) => {
  return (
    <RigidBody
      ref={ref}
      colliders="ball"
      type="dynamic"
      position={position}
      restitution={2}
      friction={0}
      angularDamping={0.5}
      linearDamping={0.5}
      enabledTranslations={[true, true, false]}>
      {component}
    </RigidBody>
  )
})

const RopeJoint = ({ a, b, c, d }) => {
  useSphericalJoint(a, b, [
    [c, 0, 0],
    [d, 0, 0]
  ])
  return null
}

const Rope = ({ scopeCount2, scopeCount3 }) => {
  const entityRefs = useRef(Array.from({ length: scopeCount2 }, () => Array.from({ length: scopeCount3 }).map(() => createRef())))

  const size = 0.3

  return (
    <group>
      {entityRefs.current.map((ref, i) =>
        ref.map((ref, j) => (
          <RopeSegment
            key={j}
            ref={ref}
            position={[j * 0.1, 0, 0]}
            component={
              <Circle args={[size]}>
                <meshStandardMaterial color={new Color(j, 0, 0)} />
              </Circle>
            }
          />
        ))
      )}

      {entityRefs.current.map(
        (ref, i) =>
          i > 0 && (
            <>
              {ref.map(
                (_, j) =>
                  j > 0 && (
                    <>
                      <RopeJoint a={ref[j]} b={ref[j - 1]} c={-size} d={size} key={j} />
                    </>
                  )
              )}
              <RopeJoint a={ref[ref.length - 1]} b={ref[0]} c={size} d={-size} />

              <RopeJoint
                a={entityRefs.current[i][0]}
                b={entityRefs.current[i - 1][Math.round(scopeCount3 / 2)]}
                c={-size}
                d={size}
                key={i}
              />
            </>
          )
      )}
      <RopeJoint
        a={entityRefs.current[entityRefs.current.length - 1][Math.round(scopeCount3 / 2)]}
        b={entityRefs.current[1][0]}
        c={size}
        d={-size}
      />
    </group>
  )
}

export const SceneJoints = () => {
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
        <Rope scopeCount2={21} scopeCount3={21} />
      </Physics>
    </>
  )
}

export default SceneJoints
