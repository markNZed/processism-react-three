import { motion } from "framer-motion-3d";
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import withAnimationAndPosition from '../withAnimationAndPosition';
import { CustomText } from './';
import { RigidBody } from '@react-three/rapier';

const Sphere = React.forwardRef(({ id, animationState, initialState, onClick, onPointerOver, onPointerOut, ...props }, ref) => {

    // This animates something that motion does not support
    const { scale = 1, color = 'blue', radius, visible = true, text = null, position } = animationState;
    const [simulationInit, setSimulationInit] = useState(true);

    // Define animation variants
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: animationState.opacity ?? 1.0 }
    };

    // Calculate text position based on animationState position and any offset
    const textPosition = new THREE.Vector3(
        position.x,
        position.y + radius * 1.2, // Adjust Y position to be slightly above whatever it is annotating or positioned at
        position.z
    );

    const rigidBodyRef = useRef();

    useEffect(() => {position
        if (rigidBodyRef.current && props.simulationReady && simulationInit) {
            setSimulationInit(false);
            rigidBodyRef.current.applyImpulse({ x: 5, y: 5, z: 5 }, true);
        }
        // A continuous force
        //rigidBodyRef.current.addForce({ x: 0, y: 10, z: 0 }, true);
        // A one-off torque rotation
        //rigidBodyRef.current.applyTorqueImpulse({ x: 0, y: 10, z: 0 }, true);
        // A continuous torque
        //rigidBodyRef.current.addTorque({ x: 0, y: 10, z: 0 }, true);
    }, [props]);

    useEffect(() => {
        console.log("Position", visible, position);
    }, []);

    return (
        <group visible={visible} >
            <CustomText
                id={`${id}.text`}
                initialState={{
                    position: textPosition,
                    text: animationState.text,
                    scale: 0.5,
                    variant: 'hidden'
                }}
            />
            {/*}
            <RigidBody ref={rigidBodyRef} position={position}>
              <mesh>
                  <sphereGeometry args={[1, 32, 32]} />
                  <meshStandardMaterial color={"pink"} />
              </mesh>
            </RigidBody>
            */}
            <mesh
                {...props}
                //initial={animationState.initialState}
                ref={ref}
                position={position}
                scale={scale}
                onClick={onClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
                depthWrite={false}
            >
                <sphereGeometry args={[radius, 32, 32]} />
                <motion.meshStandardMaterial
                    color={color}
                    initialState="visible"
                    transparent={true}
                    animate={animationState.variant}
                    variants={variants}
                    transition={{ duration: animationState.duration || 0 }}
                />
            </mesh>
        </group>
    );
});

// Automatically wrap Sphere with the HOC before export
export default withAnimationAndPosition(Sphere);
