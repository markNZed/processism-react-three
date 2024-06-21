import React, { useEffect, useRef, useState, useImperativeHandle, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import withAnimationState from '../../withAnimationState';
import { useRapier, useBeforePhysicsStep, useAfterPhysicsStep } from '@react-three/rapier';
import { useControls } from 'leva'
import _ from 'lodash';
import CompoundEntity from './CompoundEntity'
import useStore from '../../useStore'
import useStoreEntity from './useStoreEntity';
import useStoreJoint from './useStoreJoint';
import * as utils from './utils';
import useWhyDidYouUpdate from './useWhyDidYouUpdate';

/* Overview:
  Animation framework intended to provide a visual language for representing complexity.
  A set of particles form a CompoundEntity and a set of CompoundEntity form a new CompoundEntity etc
  This represents the concept of emergent entities
  Each CompoundEntity has joints that connect entity/Particle to form a "soft body"

  useStoreEntity has a node for each entity/Particle 
    node.ref is a pointer to the Three group of a CompoundEntity or Rapier RigidBody of a Particle
    node.ref.current.visualConfig holds information that impact the rendering
      This is under the ref so we can access this information when dealing with Rapier particles

  The useStoreJoint maps a unique joint id to the ref of the joint in Rapier
    We want a joint store apart from useStoreEntity because a joint is associated with two entities
*/

/*
 requestAnimationFrame aims to achieve a refresh rate of 60 frames per second (FPS). 
 Each frame has 16.67 milliseconds for all the rendering and updates to occur.
*/

// Be careful with just using props because the HOC adds props e.g. simulationReady which will cause rerendering
const Complexity = React.forwardRef(({radius, color}, ref) => {

    const pausePhysics = useStore((state) => state.pausePhysics);

    // Using forwardRef and need to access the ref from inside this component too
    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    // Avoid changes in store causing rerender
    // Direct access to the state outside of React's render flow
    const addNode = useStoreEntity.getState().addNode;
    const updateNode = useStoreEntity.getState().updateNode;
    // Leva controls

    // Using state here is a problem using functions
    const controlsConfig = {
        scopeCount: { value: 3, step: 1, },
        radius: { value: radius || 10, min: 1, max: 20 },
        impulsePerParticle: { value: 2, min: 0.1, max: 10, step: 0.1, label: "Impulse per Particle" },
        overshootScaling: { value: 1, min: 1, max: 10, step: 1, label: "Overshoot Scaling" },
        maxDisplacementScaling: { value: 1, min: 0.1, max: 2, step: 0.1, label: "Max Displacement Scaling" },
        particleRestitution: { value: 0, min: 0, max: 5, step: 0.1, label: "Particle Restitution" },
        initialScaling: { value: 1, min: 0.001, max: 10, step: 0.1, label: "Initial Scaling" },
        initialImpulse: { value: true, label: "Initial Impulse" },
        showRelations: { value: false, label: "Show Relations" },
        attractor: { value: false, label: "Enable attractor" },
        detach: { value: false, label: "Detach Experiment" },
    };

    const [controls] = useControls(() => controlsConfig);

    // Configuration object for your simulation, does not include config that needs to remount
    const config = {
        scopeCount: controls.scopeCount,
        entityCounts: [9, 9, 21],
        radius: controls.radius,
        debug: false,
        colors: [color || null, utils.getRandomColorFn, null],
        impulsePerParticle: controls.impulsePerParticle / 1000,
        overshootScaling: controls.overshootScaling,
        attractorScaling: controls.attractorScaling,
        maxDisplacementScaling: controls.maxDisplacementScaling,
        particleRestitution: controls.particleRestitution,
        ccd: false,
        initialScaling: controls.initialScaling,
        initialImpulse: controls.initialImpulse,
        showRelations: controls.showRelations,
        detach: controls.detach,
    };

    const { step } = useRapier();
    const framesPerStep = 1; // Update every framesPerStep frames
    const fixedDelta = framesPerStep / 60; //fps
    const framesPerStepCount = useRef(0);
    const startTimeRef = useRef(0);
    const durations = useRef([]); // Store the last 100 durations
    const stepCount = useRef(0); // Counter to track the number of steps
    const lastStepEnd = useRef(0);
    const averageOver = 1000;
    const [treeReady, setTreeReady] = useState(false);

    useFrame(() => {
        framesPerStepCount.current++;
        if (framesPerStepCount.current == framesPerStep) framesPerStepCount.current = 0;
        if (framesPerStepCount.current == 0 && !pausePhysics) {
            step(fixedDelta);
        }
    });

    useBeforePhysicsStep(() => {
        startTimeRef.current = performance.now();
    });

    useAfterPhysicsStep(() => {
        const endTime = performance.now();
        const duration = endTime - startTimeRef.current;
        durations.current.push(duration); // Store the duration
        if (durations.current.length > averageOver) {
            durations.current.shift(); // Keep only the last 100 entries
        }

        stepCount.current++;
 
        if (stepCount.current >= averageOver) {
            const averageDuration = durations.current.reduce((a, b) => a + b, 0) / durations.current.length;
            console.log(`Average step duration over last 100 steps: ${averageDuration.toFixed(2)} ms`);
            stepCount.current = 0; // Reset the step count
        }

        lastStepEnd.current = endTime;
    });

    // Initialization logging/debug
    useEffect(() => {
        console.log("Complexity mounting");
        // Blow away the storesremountConfigState
        useStoreEntity.getState().reset();
        useStoreJoint.getState().reset();
        addNodesRecursively(config.entityCounts);
        updateNode("root", {ref: internalRef});
        setTreeReady(true);
    }, []);
      
    function addNodesRecursively(entityCounts, parentId = "root") {
        if (entityCounts.length === 0) {
            return;
        }
        const [currentCount, ...restCounts] = entityCounts;
        for (let i = 0; i < currentCount; i++) {
            const node = {
                lastCompoundEntity: restCounts.length === 1,
                isParticle: restCounts.length === 0,
                parentId: parentId,
            };
            const newId = addNode(parentId, node);    
            addNodesRecursively(restCounts, newId);
        }
    }

    console.log("Complexity rendering", treeReady, config)

    // Pass in radius so we can pass on new radius for child CompoundEntity
    // Pass in initialPosition to avoid issues with prop being reinitialized with default value, 
    // which might be an issue with useMemo?

    return (
        <>
            {treeReady && (
                <CompoundEntity
                    id="root"
                    ref={internalRef}
                    radius={config.radius}
                    initialPosition={[0, 0, 0]}
                    config={config}
                />
            )}
        </>
    );
});

export default withAnimationState(Complexity);
