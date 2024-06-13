import React from 'react';
import { Circle as CircleDrei } from '@react-three/drei';
import { Circle } from '..';
import { Text } from '@react-three/drei';

const DebugRender = ({ id, radius, color, initialPosition, jointsData, newJoints, scope, index, localJointPosition, internalRef }) => (
    <>
        <Circle
            id={`${id}.CircleInitialPosition`}
            initialState={{
                radius: radius,
                color: color,
                opacity: 0,
            }}
        />
        <Circle
            id={`${id}.CircleCenter`}
            initialState={{
                radius: radius,
                color: color,
                opacity: 0.2,
            }}
        />
        {newJoints.current.map((particles, i) => (
            <>
                <CircleDrei
                    args={[0.1, 8]}
                    position={localJointPosition(internalRef, particles.a, "A")}
                    material-color="red"
                />
                <CircleDrei
                    args={[0.1, 8]}
                    position={localJointPosition(internalRef, particles.b, "B")}
                    material-color="green"
                />
            </>
        ))}
        {jointsData.map((data, i) => (
            <CircleDrei
                args={[0.1, 16]}
                position={[data.position.x, data.position.y, 0.3]}
            />
        ))}
        <Text
            position={[initialPosition[0], initialPosition[1], 0.1]}
            fontSize={radius / 2}
            color="black"
            anchorX="center"
            anchorY="middle"
        >
            {index}
        </Text>
    </>
);

export default DebugRender;
