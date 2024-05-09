import React, { useEffect } from 'react';
import { FatArrow } from './';
import withAnimationState from '../withAnimationState'; 

const DoubleArrow = React.forwardRef(({ id, animationState, initialState, ...props }, ref) => {

    return (
        <group ref={ref} >
            <FatArrow {...props} 
              id={`${id}.from`} 
              initialState={initialState} 
              animationState={animationState}
            />
            <FatArrow {...props} 
              id={`${id}.to`} 
              initialState={{...initialState, from: animationState.to, to: animationState.from}} 
              animationState={{...animationState, from: animationState.to, to: animationState.from}} 
            />
        </group>
    );
});

export default withAnimationState(DoubleArrow);
