import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Circle as CircleDrei } from '@react-three/drei'
import RigidBody from './RigidBody'
import CustomGroup from './CustomGroup'
import * as THREE from 'three'
import withAnimationState from '../withAnimationState'
import { Circle } from '.'

// Add a repellant force
// requestAnimationFrame aims to achieve a refresh rate of 60 frames per second (FPS).
// This means that each frame has about 16.67 milliseconds for all the rendering and updates to occur.

// Use https://github.com/pmndrs/react-three-rapier/tree/main/packages/react-three-rapier-addons#attractors
// Use https://github.com/pmndrs/react-three-rapier?tab=readme-ov-file#instanced-meshes

const Particle = React.forwardRef(({ id, initialPosition, radius, color }, ref) => {
  const internalRef = useRef()

  useImperativeHandle(ref, () => internalRef.current)

  useFrame(() => {
    if (internalRef.current.applyImpulses) {
      internalRef.current.applyImpulses()
    }
  })

  return (
    <>
      <RigidBody
        ref={internalRef}
        position={initialPosition}
        scale={0.5}
        type="dynamic"
        colliders="ball"
        linearDamping={0.5}
        angularDamping={0.5}
        enabledTranslations={[true, true, false]}>
        <CircleDrei args={[radius, 8, 8]}>
          <meshStandardMaterial color={color} />
        </CircleDrei>
      </RigidBody>
    </>
  )
})

const EmergentEntity = React.forwardRef(
  ({ id, initialPosition = [0, 0, 0], scope = 1, radius, entityCount, Entity, color = 'blue' }, ref) => {
    const entityRefs = Array.from({ length: entityCount }, () => React.createRef())
    const emergentEntityArea = areaOfCircle(radius)
    const entityRadius = radiusFromArea(emergentEntityArea / entityCount) * 0.9

  
    const entityData = useMemo(() => {
      const positions = generateEntityPositions(radius, entityCount)
      return { positions }
    }, [radius, entityCount, entityRadius])


    const internalRef = useRef()
    useImperativeHandle(ref, () => internalRef.current)

    const showScopes = true

    return (
      <CustomGroup ref={internalRef} position={initialPosition}>
        {entityData.positions.map((pos, index) => (
          <Entity
            key={`${id}-${index}`}
            id={`${id}-${index}`}
            initialPosition={pos.toArray()}
            radius={entityRadius}
            color={color}
            scope={scope + 1}
            ref={entityRefs[index]}
          />
        ))}
        {showScopes && (
          <>
            <Circle
              id={`${id}.Circle`}
              initialState={{
                radius: radius,
                color: color,
                opacity: 0
              }}
            />
            <Circle
              id={`${id}.CircleCenter`}
              initialState={{
                radius: radius,
                color: color,
                opacity: 0.2
              }}
            />
          </>
        )}
      </CustomGroup>
    )
  }
)

const EntityScope3 = React.forwardRef((props, ref) => (
  <EmergentEntity id={'Scope3'} {...props} ref={ref} Entity={Particle} entityCount={18} color={getRandomColor()} />
))

const EntityScope2 = React.forwardRef((props, ref) => (
  <EmergentEntity id={'Scope2'} {...props} ref={ref} Entity={EntityScope3} entityCount={9} color={getRandomColor()} />
))

const EntityScopes = React.forwardRef((props, ref) => (
  <EmergentEntity id={'Scope1'} {...props} ref={ref} Entity={EntityScope2} entityCount={9} />
))

export default withAnimationState(EntityScopes)


const generateEntityPositions = (radius, count) => {
  const positions = []
  const angleStep = (2 * Math.PI) / count

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    positions.push(new THREE.Vector3(x, y, 0))
  }

  return positions
}

const getRandomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

const radiusFromArea = (area) => {
  if (area <= 0) {
    return 'Area must be a positive number.'
  }
  return Math.sqrt(area / Math.PI)
}

const areaOfCircle = (radius) => {
  if (radius <= 0) {
    return 'Radius must be a positive number.'
  }
  return Math.PI * Math.pow(radius, 2)
}
