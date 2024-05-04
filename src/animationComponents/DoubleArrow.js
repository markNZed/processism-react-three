// DoubleArrow.js
import React, { useEffect } from 'react';
import { FatArrow } from './';  // Ensure this correctly imports FatArrow
import withAnimationAndPosition from '../withAnimationAndPosition';  // Ensure correct path
import useStore from '../useStore';

const DoubleArrow = React.forwardRef(({ id, animationState, from, to, visible, margin, ...props }, ref) => {

    const { updateAnimationState } = useStore();

    // Effect to update and log only on changes
    useEffect(() => {
        updateAnimationState(`${id}.from`, { variant: animationState.variant });
        updateAnimationState(`${id}.to`, { variant: animationState.variant });
        // Log the update
        console.log(`Updated animation state for ${id}.FatArrow to`, animationState.variant);
    }, [animationState.variant, id, updateAnimationState]);

    return (
        <group {...props} visible={visible} ref={ref} >
            <FatArrow id={`${id}.from`} from={from} to={to} margin={margin} animationState={animationState} />
            <FatArrow id={`${id}.to`} from={to} to={from}  margin={margin} animationState={animationState} />
        </group>
    );
});

export default withAnimationAndPosition(DoubleArrow);
