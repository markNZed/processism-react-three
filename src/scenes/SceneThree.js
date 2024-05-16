import React from 'react';
import Scene from './Scene';
import { Camera, DynamicDoubleArrow, EmergentEntity, TargetText, EmergentEntityNoBoundary } from '../animationComponents';
import * as THREE from 'three';
import { AnimationController } from '../AnimationController'; // Adjust import path as necessary
import useStore from '../useStore'; // Adjust import path as necessary
import { Environment, OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';

/****************************
Scene Description:

Demonstrate the concepts of bottom-up causation, top-down causation, emergent entities
The scene will be 2D viewed from above
In SceneOne there is an abstract concept of an Emergent Entity that is represented by a Circle.
In this scene we will not use an abstract circle to show the boundary of the entity. 
The boundary of an Emergent Entity be formed by many small spheres.

Having the emergent entity with a fluid boundary is not obvious. Ideally it would require a soft body physics simulation.
It may be possible to simulate with simple rules e.g. the ability of a particle to repel other particles could be increased closer to the center.
The "billiard ball" effect does not look very agreeable. Particles could oscillate the level of repelling.
Regions of the shape could oscillate. Easier to build this only in 2D.
Better to start with circular shapes


 ****************************/


function SceneThree() {

    const emergentEntityRadius = 3.5;

    // Delay, animationComponent id, animationState
    const animationSequence = [
        [0, 'emergent1', { variant: "default" }],
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
            <Physics gravity={[0, 0, 0]}>
                <Scene>

                    <EmergentEntityNoBoundary
                        id="emergent1"
                        initialState={{
                            position: new THREE.Vector3(-emergentEntityRadius * 2, 0, 0),
                            radius: emergentEntityRadius,
                            sphereCount: 100,
                        }}
                    />

                    <EmergentEntityNoBoundary
                        id="emergent2"
                        initialState={{
                            position: new THREE.Vector3(+emergentEntityRadius * 2, 0, 0),
                            radius: emergentEntityRadius,
                            sphereCount: 100,
                            withShell: false,
                            globalImpulseDirection: new THREE.Vector3(-1, 0, 0),
                            color: "blue",
                        }}
                    />

                    <EmergentEntityNoBoundary
                        id="emergent2"
                        initialState={{
                            position: new THREE.Vector3(+emergentEntityRadius * 6, 0, 0),
                            radius: emergentEntityRadius,
                            sphereCount: 100,
                            withShell: false,
                            globalImpulseDirection: new THREE.Vector3(1, 0, 0),
                            color: "green",
                        }}
                    />

                    <EmergentEntityNoBoundary
                        id="emergent2"
                        initialState={{
                            position: new THREE.Vector3(+emergentEntityRadius * 4, +emergentEntityRadius * 2, 0),
                            radius: emergentEntityRadius,
                            sphereCount: 100,
                            withShell: false,
                            globalImpulseDirection: new THREE.Vector3(1, 0, 0),
                            color: "orange",
                        }}
                    />

                    <EmergentEntityNoBoundary
                        id="emergent2"
                        initialState={{
                            position: new THREE.Vector3(+emergentEntityRadius * 4, -emergentEntityRadius * 2, 0),
                            radius: emergentEntityRadius,
                            sphereCount: 100,
                            withShell: false,
                            globalImpulseDirection: new THREE.Vector3(1, 0, 0),
                            color: "yellow",
                        }}
                    />

                </Scene>
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

export default SceneThree;

