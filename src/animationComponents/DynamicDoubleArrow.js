// DynamicDoubleArrow.js
import React from 'react';
import useStore from '../useStore';
import { DoubleArrow } from './';
import withAnimationAndPosition from '../withAnimationAndPosition';
import * as THREE from 'three'

const DynamicDoubleArrow = React.forwardRef(({ id, initialPosition, fromId, toId, fromOffset, toOffset, margin, ...props }, ref) => {

    const { positions } = useStore(state => ({ positions: state.positions }));

    // Utility function to calculate position with offset
    const calculatePositionWithOffset = (positionId, offset) => {
        const position = positions[positionId];
        if (!position) return null;
        return position.clone().add(offset || new THREE.Vector3(0, 0, 0));
    };

    const from = calculatePositionWithOffset(fromId, fromOffset);
    const to = calculatePositionWithOffset(toId, toOffset);

    if (!from || !to) {
        // Optionally log or handle missing data
        //console.log(`Waiting for positions: fromId=${fromId}, toId=${toId}`);
        return null; // Return null to avoid rendering until necessary data is available
    }
    
    if (!from || !to) return null; // Don't render until positions are available

    return (
        <DoubleArrow 
            {...props}
            id={`${id}.DoubleArrow`}
            from={from}
            to={to}
            margin={margin}
        />
    );
});

export default withAnimationAndPosition(DynamicDoubleArrow);
