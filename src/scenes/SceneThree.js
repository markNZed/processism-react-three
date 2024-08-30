import React, { useEffect } from 'react';
import { Camera, Complexity } from '../animationComponents';
import { AnimationController } from '../AnimationController';
import useAppStore from '../useAppStore';
import { Environment, OrbitControls, Plane } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Perf } from 'r3f-perf'
import { AxesHelper } from 'three';

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

    const physicsDebug = useAppStore((state) => state.getOption("physicsDebug"));

    const cameraInitialState = {
        position: [0, -200, 350],
        zoom: 5,
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

    function MyAxesHelper() {
        return <primitive object={new AxesHelper(5)} />;
    }

    function Narration({ text }) {
        useEffect(() => {
          if ('speechSynthesis' in window) {
            speak(text);
          } else {
            console.error("Speech Synthesis not supported in this browser.");
          }
        }, [text]);
      
        return null; // No visual component needed, just the speech
    }
      
    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1;
        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
    }

    return (
        <>
            {/*<Narration text="Welcome to the virtual world. Enjoy your journey!" />*/}
            <AnimationController animations={animationSequence}>
                <Physics timeStep={"vary"} gravity={[0, 0, 0]} paused={true} debug={physicsDebug} >
                    <Perf 
                        position={"bottom-left"} 
                        //minimal={true} 
                        //colorBlind={true} 
                        //antialias={true}
                    />
                    <>

                        <Complexity
                            id={"complex"}
                        />

                        <MyAxesHelper />   

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

