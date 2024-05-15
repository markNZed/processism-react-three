import React from 'react';
import Scene from './Scene';
import { Camera, DynamicDoubleArrow, EmergentEntity, TargetText } from '../animationComponents';
import * as THREE from 'three';
import { AnimationController } from '../AnimationController'; // Adjust import path as necessary
import useStore from '../useStore'; // Adjust import path as necessary
import { Environment, OrbitControls } from '@react-three/drei';


function SceneThree() {

    const emergentEntityRadius = 3.5;

    // Delay, animationComponent id, animationState
    const animationSequence = [
        [0, 'inter_emergent', { visible: false }],
        [0, 'emergent1', { variant: "oneSphere" }],
        [0, 'emergent1.Circle', { variant: "hidden" }],
        [0, 'emergent2', { visible: false }],
        [0, 'emergent2.Circle', { variant: "hidden" }],
        [0, 'emergent2.causation', { visible: false }],
        [1, 'emergent1', { variant: "oneSphere-details", }],
        [1, 'entityLabel', { variant: "fadeIn", }],
        [1, 'entityLabel', { variant: "fadeOut", }],
        [1, 'emergent1', { variant: "twoSphere", why: "Showing second sphere" }],
        [1, 'emergent1', { variant: "relation" }],
        [1, 'emergent1', { variant: "allRelations" }],
        [1, 'accumulationDescription', { variant: "fadeIn" }],
        [1, 'accumulationDescription', { variant: "fadeOut" }],
        [1, 'emergent1.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
        [1, 'emergent1Label', { duration: 1, variant: "fadeIn" }],
        [1, 'emergent1Label', { duration: 1, variant: "fadeOut" }],
        [1, 'emergent2', { visible: true, variant: "allRelations" }],
        [1, 'emergent2.Circle', { duration: 1, variant: "visible", opacity: 0.5, visible: true }],
        [2, 'emergent1Label', { text: 'Bottom Up', variant: "fadeIn" }],
        [1, 'emergent1.causation', { visible: true }],
        [0.5, 'inter_emergent', { visible: true }],
        [2, 'emergent2Label', { text: 'Top Down', variant: "fadeIn" }],
        [1, 'emergent2.causation', { visible: true }],
        [1, 'emergent1', { variant: "moved", offset: new THREE.Vector3(5, 5, 5) }],
    ];

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
            <Scene>

                <EmergentEntity
                    id="emergent1"
                    initialState={{
                    position: new THREE.Vector3(-emergentEntityRadius * 2, 0, 0),
                    radius: emergentEntityRadius,
                    causation: "bottomup",
                    }}
                />

                <EmergentEntity
                    id="emergent2"
                    initialState={{
                    position: new THREE.Vector3(emergentEntityRadius * 2, 0, 0),
                    radius: emergentEntityRadius,
                    causation: "topdown",
                    }}
                />

                <DynamicDoubleArrow
                    id={"inter_emergent"}
                    initialState={{
                    fromId: "emergent1",
                    toId: "emergent2",
                    visible: false,
                    }}
                />

                <TargetText
                    id={'entityLabel'}
                    targetId={'emergent1.Sphere1'}
                    initialState={{ text: "Entity 1", variant: 'hidden', scale: .5 }}
                    offset={new THREE.Vector3(0, 1.5, 0)}
                />

                <TargetText
                    id={'emergent1Label'}
                    targetId={'emergent1'}
                    initialState={{ text: "Emergent Entity", variant: 'hidden' }}
                    offset={new THREE.Vector3(0, 5, 0)}
                />
                <TargetText
                    id={'emergent2Label'}
                    targetId={'emergent2'}
                    initialState={{ text: "Emergent Entity", variant: 'hidden' }}
                    offset={new THREE.Vector3(0, 5, 0)}
                />
                <TargetText
                    id={'accumulationDescription'}
                    targetId={'emergent1.relations1'}
                    initialState={{ text: "Accumulation", variant: 'hidden', scale: .3 }}
                    offset={new THREE.Vector3(0, 3, -1.5)}
                />

            </Scene>
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

export default SceneThree;

