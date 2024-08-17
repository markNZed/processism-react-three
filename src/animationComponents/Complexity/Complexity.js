import React, {  useRef, useMemo } from 'react';
import withAnimationState from '../../withAnimationState';
import _ from 'lodash';
import CompoundEntity from './CompoundEntity'
import useAnimateComplexity from './useAnimateComplexity';
import PhysicsController from './PhysicsController';
import useConfigPanel from './useConfigPanel';
import useStoreEntity from './useStoreEntity';

/* Overview:
  Animation framework intended to provide a visual language for representing complexity.
  A set of particles form a CompoundEntity and a set of CompoundEntity form a new CompoundEntity etc
  This represents the concept of emergent entities
  Each CompoundEntity has joints that connect entity/Particle to form a "soft body"

  useStoreEntity has a node for each entity/Particle 
    node.ref is a pointer to the Three group of a CompoundEntity or Rapier RigidBody of a Particle
    node.ref.current.visualConfig holds information that impact the rendering
      This is under the ref so we can access this information when dealing with Rapier particles

*/

/*
 requestAnimationFrame aims to achieve a refresh rate of 60 frames per second (FPS). 
 Each frame has 16.67 milliseconds for all the rendering and updates to occur.
*/

// Be careful with just using props because the HOC adds props e.g. simulationReady which will cause rerendering
const Complexity = React.forwardRef(({id, radius, color}, ref) => {

    const initialCreationPathOne = [[0, 0, 25], [0, 0, 5]];
    const initialCreationPathTwo = [[0, 0, 25], [0, 0, -25]];

    const storeOne = useMemo(() => useStoreEntity(), []);
    const storeTwo = useMemo(() => useStoreEntity(), []);

    // Using forwardRef and need to access the ref from inside this component too
    const refOne = useRef();
    const refTwo = useRef();

    const config = useConfigPanel({ radius, color });

    const {storeEntityReady: storeEntityOneReady} = useAnimateComplexity(config, refOne, storeOne);
    const {storeEntityReady: storeEntityTwoReady} = useAnimateComplexity(config, refTwo, storeTwo);
    
    console.log("Complexity rendering", id, storeEntityOneReady, storeOne.getState(), config)

    // Pass in radius so we can pass on new radius for child CompoundEntity
    // Pass in initialPosition to avoid issues with prop being reinitialized with default value, 
    // which might be an issue with useMemo?

    return (
        <group ref={ref} >
            <PhysicsController config={config} />
            {storeEntityOneReady && (
                <CompoundEntity
                    id={"root"}
                    ref={refOne}
                    radius={config.radius}
                    initialPosition={[0, 0, 0]}
                    config={config}
                    entityStore={storeOne}
                    initialCreationPath={initialCreationPathOne}
                />
            )}
            {storeEntityTwoReady && (
                <CompoundEntity
                    id={"root"}
                    ref={refTwo}
                    radius={config.radius}
                    initialPosition={[0, 0, -50]}
                    config={config}
                    entityStore={storeTwo}
                    initialCreationPath={initialCreationPathTwo}
                />
            )}
        </group>
    );
});

export default withAnimationState(Complexity);
