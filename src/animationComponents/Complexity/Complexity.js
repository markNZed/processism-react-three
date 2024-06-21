import React, { useEffect, useRef, useState, useImperativeHandle, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import withAnimationState from '../../withAnimationState';
import { useRapier, useBeforePhysicsStep, useAfterPhysicsStep } from '@react-three/rapier';
import { useControls } from 'leva'
import _ from 'lodash';
import CompoundEntity from './CompoundEntity'
import useStore from '../../useStore'
import useStoreEntity from './useStoreEntity';
import useStoreRelation from './useStoreRelation';
import useStoreJoint from './useStoreJoint';
import * as utils from './utils';
import useWhyDidYouUpdate from './useWhyDidYouUpdate';

/* Overview:
 A set of Particle forms a CompoundEntity and a set of CompoundEntity forms a new CompoundEntity etc
 This shows the concept of emergent entities 
 Each CompoundEntity has joints that connect entity/Particle to form a "soft body"

  The useStoreEntity has a node for each entity/Particle 
     node.ref is a pointer to the Three group of a CompoundEntity or Rapier RigidBody of a Particle.

  The useStoreJoint maps a unique joint id to the ref of the joint in Rapier

  The useStoreRelation maps a the node id of the from node to an array to node id for each relation.
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
    const getNode = useStoreEntity.getState().getNode;
    // Leva controls
    // Some controls require remounting (e.g. scope0count) so make the CompoundEntity key dependent on these
    // Using state here is a problemn for the functions
    // The onChange in scope0 etc here breaks things
    const [controlsConfig, setControlsConfig] = useState({
        scopeCount: { value: 3, step: 1, },
        radius: { value: radius || 10, min: 1, max: 20 },
        impulsePerParticle: { value: 2, min: 0.1, max: 10, step: 0.1, label: "Impulse per Particle" },
        overshootScaling: { value: 1, min: 1, max: 10, step: 1, label: "Overshoot Scaling" },
        maxDisplacementScaling: { value: 1, min: 0.1, max: 2, step: 0.1, label: "Max Displacement Scaling" },
        particleRestitution: { value: 0, min: 0, max: 5, step: 0.1, label: "Particle Restitution" },
        attractorScaling: { value: [0, -0.8, -0.1], label: "Attractor Scaling" },
        initialScaling: { value: 1, min: 0.001, max: 10, step: 0.1, label: "Initial Scaling" },
        initialImpulse: { value: true, label: "Initial Impulse" },
        showRelations: { value: false, label: "Show Relations" },
        attractor: { value: false, label: "Enable attractor" },
        detach: { value: false, label: "Detach Experiment" },
        scope0: { value: 9, min: 1, max: 30, step: 1 },
        scope1: { value: 9, min: 1, max: 30, step: 1 },
        scope2: { value: 21, min: 1, max: 30, step: 1 },
    });

    const [controls] = useControls(() => controlsConfig, [controlsConfig]);

    // Configuration object for your simulation, does not include config that needs to remount
    const config = {
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

    // Configuration object for your simulation that needs to remount
    const remountConfig = useRef({
        scopeCount: controls.scopeCount,
        entityCounts: [controls.scope0, controls.scope1, controls.scope2],
        radius: controls.radius,
    });

    // Use a state for remountConfig to sync update with new key
    const [remountConfigState, setRemountConfigState] = useState(JSON.parse(JSON.stringify(remountConfig.current)));

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

    // Because this renders then remountConfig gets reset then entityCounts has an undefined value if we reduce te scope
    useEffect(() => {
        let change = false;
        const updatedRemountConfig = { ...remountConfig.current };

        Object.keys(remountConfig.current).forEach(key => {
            if (key === 'entityCounts') {
                const entityCounts = [];
                for (let i = 0; i < controls.scopeCount; i++) {
                    entityCounts.push(controls[`scope${i}`]);
                }
                if (!_.isEqual(entityCounts, remountConfig.current.entityCounts)) {
                    updatedRemountConfig.entityCounts = entityCounts;
                    change = true;
                }
            } else if (controls[key] !== remountConfig.current[key]) {
                updatedRemountConfig[key] = controls[key];
                change = true;
            }
        });

        if (change) {
            remountConfig.current = updatedRemountConfig;
            setRemountConfigState(updatedRemountConfig);
        }

        console.log("useEffect controls", controls, "change", change, "remountConfig", remountConfig.current, "remountConfigState", remountConfigState);
    }, [controls, controlsConfig]);

    useEffect(() => {
        console.log("remountConfigState", remountConfigState);
    }, [remountConfigState]);

    // When scopeCount changes setConfig then we refresh the controls so we can add to scopeCountsUI
    useEffect(() => {
        if (controls.scopeCount) {
            // Delete all the scopeX entries
            const controlsConfigCopy = JSON.parse(JSON.stringify(controlsConfig));
            const scopeRegex = /^scope\d+/;
            Object.keys(controlsConfigCopy).forEach(key => {
                if (scopeRegex.test(key)) {
                    delete controlsConfigCopy[key];
                }
            });
            const defaultValue = 5;
            let scopeCountsUI = {};
            for (let i = 0; i < controls.scopeCount; i++) {
                let defaultValueOverride = defaultValue;
                if (controls[`scope${i}`]) {
                    defaultValueOverride = controls[`scope${i}`];
                }
                scopeCountsUI[`scope${i}`] = {
                    value: defaultValueOverride,
                    min: 1,
                    max: 30,
                    step: 1,
                };
            }
            const newControlsConfig = { ...scopeCountsUI, ...controlsConfigCopy };
            console.log("setControlsConfig", "controls.scopeCount", controls.scopeCount, "remountConfig.current", "newControlsConfig", newControlsConfig);
            // Update controlsConfig to trigger update of useControls
            setControlsConfig(newControlsConfig);
        }
    }, [controls.scopeCount]);

    // Need to reset physics when we reset the Complexity
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
        //console.log(`useAfterPhysicsStep: ${stepCount.current} ${framesPerStepCount.current} ${duration}`);

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
        // Blow away the stores
        useStoreEntity.getState().reset();
        useStoreRelation.getState().reset();
        useStoreJoint.getState().reset();
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

    // Initialization the tree store, do not have a UI for this yet
    useEffect(() => {
        if (remountConfigState.entityCounts) {
            console.log("remountConfigState.entityCounts begin", config, remountConfigState, controls)
            const entityCountsStr = remountConfigState.entityCounts.toString();
            const rootNode = getNode("root");
            if (rootNode.entityCountsStr !== entityCountsStr)   {
                addNodesRecursively(remountConfigState.entityCounts);
                updateNode("root", {entityCountsStr, ref: internalRef});
                setTreeReady(true)
                console.log("updateNodesConfigRecursively")
            }
            console.log("remountConfigState.entityCounts end")
        }
    }, [controls, remountConfigState]);

    useEffect(() => {
        if (treeReady) {
            const entityCountsStr = remountConfigState.entityCounts.toString();
            console.log("Scope treeReady", treeReady, entityCountsStr)
        }
    }, [treeReady]);

    useWhyDidYouUpdate(`Complexity`, {radius, color, controls});

    console.log("Complexity rendering", treeReady, remountConfigState)

    // Pass in radius so we can pass on new radius for child CompoundEntity
    // Pass in initialPosition to avoid issues with prop being reinitialized with default value
    // Which might be an issue with useMemo?

    return (
        <>
            {treeReady && (
                <CompoundEntity
                    key={JSON.stringify(remountConfigState)}
                    ref={internalRef}
                    radius={remountConfigState.radius}
                    initialPosition={[0, 0, 0]}
                    config={{ ...config, ...remountConfigState }}
                    id="root"
                />
            )}
        </>
    );
});

export default withAnimationState(Complexity);
