import React, { useEffect } from 'react';
import { Physics } from '@react-three/rapier';
import { Camera, DynamicDoubleArrow, EmergentEntity, TargetText } from '../animationComponents';
import * as THREE from 'three';
import { AnimationController } from '../AnimationController'; // Adjust import path as necessary
import useStore from '../useStore'; // Adjust import path as necessary
import { Environment, OrbitControls } from '@react-three/drei';

function SceneTwo() {

    const emergentEntityRadius = 3.5;

    // Delay, id, animationState
    const animationSequence = [
        [0, 'inter_emergent', { visible: false }],
        [0, 'emergent1', { variant: "oneSphere" }],
        [0, 'emergent1.Circle', { variant: "hidden" }],
        // This is an example of a concurrent set of animations, we can use arrays recursively
        [
            [1, 'emergent1.Sphere1', { action: { name: 'applyImpulse', params: [{ x: 10, y: 5, z: 0 }] } }],
            [1, 'emergent1', { variant: "oneSphere-details", }],
            [1, 'entityLabel', { variant: "fadeIn", }],
            [1, 'entityLabel', { variant: "fadeOut", }],
            [1, 'emergent1', { variant: "twoSphere", why: "Showing second sphere" }],
            [1, 'emergent1', { variant: "relation" }],
            [1, 'emergent1', { variant: "allRelations" }],
        ],
        [1, 'emergent1.Sphere1', { action: { name: 'applyImpulse', params: [{ x: 10, y: 5, z: 0 }] } }],
        [1, 'accumulationDescription', { variant: "fadeIn" }],
        [1, 'accumulationDescription', { variant: "fadeOut" }],
        [1, 'emergent1.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
        [1, 'emergent1Label', { duration: 1, variant: "fadeIn" }],
        [1, 'emergent1Label', { duration: 1, variant: "fadeOut" }],
        [2, 'camera', { position: [0, -30, 10], duration: 2000 }],
        [2, 'emergent1Label', { text: 'Bottom Up', variant: "fadeIn" }],
        [1, 'emergent1.causation', { visible: true }],
         [1, 'emergent1', { variant: "moved", offset: new THREE.Vector3(5, 5, 5) }],
    ];

      // Initial and animated states for the camera
  const cameraInitialState = {
    position: [0, 0, 35],
    zoom: 35,
    left: window.innerWidth / -2,
    right: window.innerWidth / 2,
    top: window.innerHeight / 2,
    bottom: window.innerHeight / -2,
    near: 0.1,
    far: 100
  };

  return (
    <>
        <AnimationController animations={animationSequence} useStore={useStore}>
            <Physics gravity={[0, 0, 0]}>
                <>
                    <EmergentEntity
                        id="emergent1"
                        initialState={{
                        position: new THREE.Vector3(-emergentEntityRadius * 2, 0, 0),
                        radius: emergentEntityRadius,
                        causation: "bottomup",
                        }}
                    />

                    <TargetText
                        id={'entityLabel'}
                        targetId={'emergent1.Sphere1'}
                        initialState={{ position: new THREE.Vector3(0, 0, 0), visible: true, text: "Entity 1", variant: 'hidden', scale: .5 }}
                        offset={new THREE.Vector3(0, 1.5, 0)}
                    />

                    <TargetText
                        id={'emergent1Label'}
                        targetId={'emergent1'}
                        initialState={{ position: new THREE.Vector3(0, 0, 0), visible: true, text: "Emergent Entity", variant: 'hidden' }}
                        offset={new THREE.Vector3(0, 5, 0)}
                    />
                    <TargetText
                        id={'accumulationDescription'}
                        targetId={'emergent1.relations1'}
                        initialState={{ position: new THREE.Vector3(0, 0, 0), visible: true, text: "Accumulation", variant: 'hidden', scale: .3 }}
                        offset={new THREE.Vector3(0, 3, -1.5)}
                    />
                </>
            </Physics>
        </AnimationController>

        <Camera
            id={"camera"}
            initialState={cameraInitialState}
        />
        <Environment preset="sunset" />
        <OrbitControls />
    </>
  );
}

export default SceneTwo;

