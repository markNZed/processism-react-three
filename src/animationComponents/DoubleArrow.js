// DoubleArrow.js
import React, { useEffect } from 'react';
import { FatArrow } from './';  // Ensure this correctly imports FatArrow
import withAnimationAndPosition from '../withAnimationAndPosition';  // Ensure correct path
import useStore from '../useStore';

const DoubleArrow = React.forwardRef(({ id, animationState, from, to, visible, margin, ...props }, ref) => {

    const { updateAnimationState } = useStore();

    // Effect to update and log only on changes
    useEffect(() => {
        if (Object.keys(animationState).length > 0) {
            updateAnimationState(`${id}.from`, animationState);
            updateAnimationState(`${id}.to`, animationState);
        }
    }, [animationState, id, updateAnimationState]);

    return (
        <group {...props} visible={visible} ref={ref} >
            <FatArrow id={`${id}.from`} from={from} to={to} margin={margin} />
            <FatArrow id={`${id}.to`} from={to} to={from}  margin={margin} />
        </group>
    );
});

export default withAnimationAndPosition(DoubleArrow);
