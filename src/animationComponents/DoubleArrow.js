// DoubleArrow.js
import React from 'react';
import { FatArrow } from './';  // Ensure this correctly imports FatArrow
import withAnimationAndPosition from '../withAnimationAndPosition';  // Ensure correct path

const DoubleArrow = React.forwardRef(({ id, from, to, visible, margin, ...props }, ref) => {
    return (
        <group {...props} visible={visible} ref={ref} >
            <FatArrow id={`${id}.from`} from={from} to={to} margin={margin} />
            <FatArrow id={`${id}.to`} from={to} to={from}  margin={margin} />
        </group>
    );
});

export default withAnimationAndPosition(DoubleArrow);
