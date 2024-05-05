// DoubleArrow.js
import React, { useEffect } from 'react';
import { FatArrow } from './';  // Ensure this correctly imports FatArrow
import withAnimationAndPosition from '../withAnimationAndPosition';  // Ensure correct path
import useStore from '../useStore';

const DoubleArrow = React.forwardRef(({ id, animationState, initialState, from, to, margin, ...props }, ref) => {

    const { updateAnimationState } = useStore();

    // Effect to update and log only on changes
    useEffect(() => {
        if (Object.keys(animationState).length > 0) {
            updateAnimationState(`${id}.from`, animationState);
            updateAnimationState(`${id}.to`, animationState);
        }
    }, [animationState, id, updateAnimationState]);

    return (
        <group {...props} ref={ref} >
            <FatArrow id={`${id}.from`} from={from} to={to} margin={margin} initialState={initialState} />
            <FatArrow id={`${id}.to`} from={to} to={from}  margin={margin} initialState={initialState} />
        </group>
    );
});

export default withAnimationAndPosition(DoubleArrow);
