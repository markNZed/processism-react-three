// DoubleArrow.js
import React from 'react';
import { animated } from '@react-spring/three';
import { FatArrow } from './';  // Ensure this correctly imports FatArrow
import withAnimationAndPosition from '../withAnimationAndPosition';  // Ensure correct path

const DoubleArrow = React.forwardRef(({ from, to, position, opacity, visible, ...props }) => {
    return (
        <animated.group {...props} position={position} visible={visible}>
            <FatArrow id={`${props.id}.from`} from={from} to={to} />
            <FatArrow id={`${props.id}.to`} from={to} to={from} />
        </animated.group>
    );
});

export default withAnimationAndPosition(DoubleArrow);
