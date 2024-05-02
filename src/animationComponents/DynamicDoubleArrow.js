// DynamicDoubleArrow.js
import React from 'react';
import useStore from '../useStore';
import { DoubleArrow } from './';
import withAnimationAndPosition from '../withAnimationAndPosition';
import * as THREE from 'three'

const DynamicDoubleArrow = React.forwardRef(({ fromId, toId, fromOffset, toOffset, ...props }, ref) => {
    const { positions } = useStore(state => ({ positions: state.positions }));
    
    const from = positions[fromId] ? positions[fromId].clone().add(fromOffset || new THREE.Vector3(0, 0, 0)) : null;
    const to = positions[toId] ? positions[toId].clone().add(toOffset || new THREE.Vector3(0, 0, 0)) : null;

    if (!from || !to) return null; // Don't render until positions are available

    return (
        <DoubleArrow 
            ref={ref}
            {...props}
            id={`${props.id}_dynamic`}
            from={from}
            to={to}
        />
    );
});

export default withAnimationAndPosition(DynamicDoubleArrow);
