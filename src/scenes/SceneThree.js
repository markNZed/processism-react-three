import React, { useEffect } from 'react';
import { Camera, Complexity } from '../animationComponents';
import { AnimationController } from '../AnimationController'; // Adjust import path as necessary
import useStore from '../useStore'; // Adjust import path as necessary
import { Environment, OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Perf } from 'r3f-perf'

/****************************
Scene Description:

Demonstrate the concepts of bottom-up causation, top-down causation, emergent entities
The scene will be 2D viewed from above
In SceneOne there is an abstract concept of an Emergent Entity that is represented by a Circle.
In this scene we will not use an abstract circle to show the boundary of the entity. 
The boundary of an Emergent Entity be formed by many small spheres.

Having the emergent entity with a fluid boundary is not obvious. It could use a soft body physics simulation.

Instead of top-down: outside-in
Instead of bottom-up: inside-out

 ****************************/


function SceneThree() {

    // Delay, animationComponent id, animationState
    const animationSequence = [
        //[0, 'emergent1', { variant: "default" }],
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

    //timestep defaults to 1 / 60 timeStep={"vary"} 
    // Physics allowSleep={true} ?
    // Physics is paused so we can manually control the step from Complexity
    // numSolverIterations={2} numAdditionalFrictionIterations={2} erp={0.5} allowedLinearError={0.01}
    // numSolverIterations={2} numAdditionalFrictionIterations={2}

    useEffect(() => {
        console.log("SceneThree mounting");
    }, []);

    return (
        <>
            <AnimationController animations={animationSequence} useStore={useStore}>
                <Physics timeStep={"vary"} gravity={[0, 0, 0]} paused={true} debug={false} >
                    <Perf position={"bottom-left"} minimal={true} colorBlind={true} antialias={true}/>
                    <>

                        <Complexity
                            id={"complex"}
                            color={"blue"}
                        />

                    </>
                </Physics>
            </AnimationController>

            <Camera
                id={"camera"}
                initialState={cameraInitialState}
            />
            <Environment preset="sunset" />
            <OrbitControls enablePan={true} />
        </>
    );

}

export default SceneThree;

