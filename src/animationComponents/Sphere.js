import { RigidBody } from '@react-three/rapier';
import { motion } from "framer-motion-3d";
import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import useAppStore from '../useAppStore';
import withAnimationState from '../withAnimationState';

const Sphere = React.forwardRef(({ id, animationState, onClick, onPointerOver, onPointerOut, ...props }, ref) => {
    const { scale = 1, color = 'blue', radius, visible = true, position } = animationState;
    const [simulationInit, setSimulationInit] = useState(true);
    const usePhysics = useAppStore(state => state.usePhysics);

    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: animationState.opacity ?? 1.0 }
    };
    const defaultVariant = "visible";

    const rigidBodyRef = useRef();
    useEffect(() => {
        props.setRigidBodyRef(rigidBodyRef);
    }, []);

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
                initialState={defaultVariant}
                transparent={true}
                animate={animationState.variant || defaultVariant }
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

export default withAnimationState(Sphere);
