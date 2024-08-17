import React, {  useRef, useImperativeHandle } from 'react';
import withAnimationState from '../../withAnimationState';
import _ from 'lodash';
import CompoundEntity from './CompoundEntity'
import useAnimateComplexity from './useAnimateComplexity';
import PhysicsController from './PhysicsController';
import useConfigPanel from './useConfigPanel';

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
const Complexity = ({id, radius, color}) => {

    // Using forwardRef and need to access the ref from inside this component too
    const ref = useRef();

    const config = useConfigPanel({ radius, color });

    const {storeEntityReady} = useAnimateComplexity(config, ref);
    
    console.log("Complexity rendering", id, storeEntityReady, config)

    // Pass in radius so we can pass on new radius for child CompoundEntity
    // Pass in initialPosition to avoid issues with prop being reinitialized with default value, 
    // which might be an issue with useMemo?

    return (
        <>
            <PhysicsController config={config} />
            {storeEntityReady && (
                <CompoundEntity
                    id={"root"}
                    ref={ref}
                    radius={config.radius}
                    initialPosition={[0, 0, 0]}
                    config={config}
                />
            )}
        </>
    );
};

export default withAnimationState(Complexity);
