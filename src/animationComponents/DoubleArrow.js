// DoubleArrow.js
import React, { useEffect } from 'react';
import { FatArrow } from './';  // Ensure this correctly imports FatArrow
import withAnimationAndPosition from '../withAnimationAndPosition';  // Ensure correct path

const DoubleArrow = React.forwardRef(({ id, animationState, ...props }, ref) => {

    return (
        <group {...props} ref={ref} >
            <FatArrow {...props} id={`${id}.from`} initialState={animationState} />
            <FatArrow {...props} id={`${id}.to`} initialState={{...animationState, from: animationState.to, to: animationState.from}} />
        </group>
    );
});

export default withAnimationAndPosition(DoubleArrow);
