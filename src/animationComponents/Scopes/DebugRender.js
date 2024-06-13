import React from 'react';
import { Circle as CircleDrei } from '@react-three/drei';
import { Circle } from '..';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const localJointPosition = (groupRef, particle, side) => {
    const worldPosition = particle.ref.current.translation();
    const xOffset = particle.offset.x;
    const yOffset = particle.offset.y;
    const zOffset = 0.4;
    const worldVector = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
    const localVector = groupRef.current.worldToLocal(worldVector);
    localVector.x += xOffset;
    localVector.y += yOffset;
    localVector.z += zOffset;
    const result = [localVector.x, localVector.y, localVector.z];
    return result
};

const DebugRender = ({ id, radius, color, initialPosition, jointsData, newJoints, scope, index, internalRef }) => (
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
            <React.Fragment key={`${id}.${i}`}>
                <CircleDrei
                    key={`${id}.${i}.a`}
                    args={[0.1, 8]}
                    position={localJointPosition(internalRef, particles.a, "A")}
                    material-color="red"
                />
                <CircleDrei
                    key={`${id}.${i}.b`}
                    args={[0.1, 8]}
                    position={localJointPosition(internalRef, particles.b, "B")}
                    material-color="green"
                />
            </React.Fragment>
        ))}
        {jointsData.map((data, i) => (
            <CircleDrei
                key={`${id}.${i}`}
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
