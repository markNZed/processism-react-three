import React, { useEffect } from 'react';
import { Circle as CircleDrei } from '@react-three/drei';
import { Circle } from '..';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../useStore';

const localJointPosition = (groupRef, particle) => {
    const worldPosition = particle.ref.current.translation();
    const xOffset = particle.offset.x;
    const yOffset = particle.offset.y;
    const zOffset = 0.4;
    const worldVector = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
    const localVector = groupRef.current.worldToLocal(worldVector);
    localVector.x += xOffset;
    localVector.y += yOffset;
    localVector.z += zOffset;
    return [localVector.x, localVector.y, localVector.z];
};

const DebugRender = ({ id, radius, color, initialPosition, jointsData, newJointsRef, index, internalRef, isDebug, centerRef }) => {
    const getComponentRef = useStore((state) => state.getComponentRef);

    useEffect(() => {
        if (isDebug) {
            const circleCenterRef = getComponentRef(`${id}.CircleCenter`);
            if (circleCenterRef && circleCenterRef.current && internalRef.current && centerRef.current) {
                const localCenter = internalRef.current.worldToLocal(centerRef.current.clone());
                circleCenterRef.current.position.copy(localCenter);
            }
        }
    }, [isDebug, getComponentRef, id, internalRef, centerRef]);

    if (!isDebug) return null

    return (
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
            {newJointsRef.current.map((particles, i) => (
                <React.Fragment key={`${id}.${i}`}>
                    <CircleDrei
                        key={`${id}.${i}.a`}
                        args={[0.1, 8]}
                        position={localJointPosition(internalRef, particles.a)}
                        material-color="red"
                    />
                    <CircleDrei
                        key={`${id}.${i}.b`}
                        args={[0.1, 8]}
                        position={localJointPosition(internalRef, particles.b)}
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
};

export default DebugRender;
