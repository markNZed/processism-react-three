import { RigidBody } from '@react-three/rapier';
import { motion } from "framer-motion-3d";
import React, { useEffect, useRef, useState } from 'react';
import useStore from '../useStore';
import withAnimationState from '../withAnimationState';
// @ts-check

const Sphere = React.forwardRef(({ id, animationState, onClick, onPointerOver, onPointerOut, ...props }, ref) => {

    // This animates something that motion does not support
    const { scale = 1, color = 'blue', radius, visible = true, position } = animationState;
    const [simulationInit, setSimulationInit] = useState(true);
    const usePhysics = useStore(state => state.usePhysics);

    // Define animation variants
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: animationState.opacity ?? 1.0 }
    };

    // Calculate labelText position based on animationState position and any offset

    const rigidBodyRef = useRef();

    useEffect(() => {
        if (rigidBodyRef.current && props.simulationReady && simulationInit) {
            setSimulationInit(false);
            rigidBodyRef.current.applyImpulse({ x: 1, y: 1, z: 1 }, true);
        }
        // A continuous force
        //rigidBodyRef.current.addForce({ x: 0, y: 10, z: 0 }, true);
        // A one-off torque rotation
        //rigidBodyRef.current.applyTorqueImpulse({ x: 0, y: 10, z: 0 }, true);
        // A continuous torque
        //rigidBodyRef.current.addTorque({ x: 0, y: 10, z: 0 }, true);
    }, [props]);

    const wrappedMesh = (
        <mesh
            {...props}
            ref={ref}
            userData={{ globalId: id }}
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
    );

    return (
        <group visible={visible} >
            {usePhysics ? (
                <RigidBody ref={rigidBodyRef} enabledTranslations={[true, true, false]}>
                    {wrappedMesh}
                </RigidBody>
            ) : wrappedMesh}
        </group>
    );
});

// Automatically wrap Sphere with the HOC before export
export default withAnimationState(Sphere);
