// DoubleArrow.js
import React, { useEffect } from 'react';
import { FatArrow } from './';  // Ensure this correctly imports FatArrow
import withAnimationAndPosition from '../withAnimationAndPosition';  // Ensure correct path

const DoubleArrow = React.forwardRef(({ id, animationState, from, to, margin, ...props }, ref) => {

    return (
        <group {...props} ref={ref} >
            <FatArrow id={`${id}.from`} initialState={animationState} from={from} to={to} margin={margin} {...props}/>
            <FatArrow id={`${id}.to`} initialState={animationState} from={to} to={from}  margin={margin} {...props} />
        </group>
    );
});

export default withAnimationAndPosition(DoubleArrow);
