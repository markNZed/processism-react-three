import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';

const useAnimateImpulses = (
    initialized,
    node,
    entityNodes,
    initialPosition,
) => {
    // Impulse that will be applied to Particles of this CompoundEntity
    const impulseRef = useRef();
    const config = node.config;
    const impulsePerParticle = (config.impulsePerParticle || 0.02) * (node.depth + 1);
    const getNodeProperty = useStoreEntity.getState().getNodeProperty;
    const particleAreaRef = getNodeProperty('root', 'particleAreaRef');
    const id = node.id;
    const internalRef = node.ref;
    const impulseStateRef = useRef('init');
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    const prevCenterRef = useRef(new THREE.Vector3());
    const initialPositionVector = useMemo(() => new THREE.Vector3(...initialPosition), []);

    const entityRefsArray = entityNodes.map(entity => entity.ref);

    const entityImpulses = (center, impulseIn) => {
        const impulse = impulseIn.clone();
        impulse.multiplyScalar(1 / entityRefsArray.length);
        const particlesCount = node.particlesRef.current.length;
        entityRefsArray.forEach((entity, i) => {
            if (entity.current) {
                const entityCenter = entity.current.getCenter();
                if (entityCenter) {
                    const displacement = entityCenter.clone()
                    displacement.sub(center);
                    const directionToCenter = displacement.clone();
                    directionToCenter.negate().normalize();
                    if (impulse.length() == 0) {
                        impulse.copy(directionToCenter);
                        impulse.multiplyScalar(impulsePerParticle * particleAreaRef * particlesCount / entityRefsArray.length);
                    }
                    const overshoot = displacement.length() - config.maxDisplacement;
                    if (overshoot > 0) {
                        impulse.copy(directionToCenter);
                        impulse.multiplyScalar(impulsePerParticle * particleAreaRef * particlesCount / entityRefsArray.length);
                        impulse.multiplyScalar(config.overshootScaling);
                    }
                    if (config.attractorScaling) {
                        const directionToCenter = config.attractorScaling > 0 ? displacement.negate().normalize() : displacement.normalize();
                        directionToCenter.multiplyScalar(impulse.length() * Math.abs(config.attractorScaling));
                        impulse.add(directionToCenter);
                    }
                    entity.current.addImpulse(impulse);
                }
            }
        });
    };

    const applyInitialImpulses = () => {
        const initialImpulseVectors = Array.from({ length: entityRefsArray.length }, () => new THREE.Vector3(
            (Math.random() - 0.5) * impulsePerParticle * config.initialScaling,
            (Math.random() - 0.5) * impulsePerParticle * config.initialScaling,
            0
        ));
        entityRefsArray.forEach((entity, i) => {
            if (entity.current) {
                const particlesCount = node.particlesRef.current.length;
                const perEntityImpulse = initialImpulseVectors[i].multiplyScalar(particlesCount);
                entity.current.addImpulse(perEntityImpulse);
            }
        });
    };

    const calculateImpulses = (centerRef, prevCenterRef) => {
        const displacement = centerRef.current.clone();
        displacement.sub(prevCenterRef.current);
        const impulseDirection = displacement.normalize();
        const particlesCount = node.particlesRef.current.length;
        impulseRef.current = impulseDirection.multiplyScalar(impulsePerParticle * particleAreaRef * particlesCount);
    };

    // Impulse on every frame
    useFrame(() => {
        if (initialized) {
            const impulse = internalRef.current.getImpulse();
            if (impulse.length() > 0) {
                const perEntityImpulse = internalRef.current.getImpulse().multiplyScalar(1 / entityRefsArray.length);
                entityRefsArray.forEach((entity) => {
                    entity.current.addImpulse(perEntityImpulse);
                });
                internalRef.current.setImpulse(new THREE.Vector3());
            }
        }
    });

    useFrame(() => {
        // State machine allows for computation to be distributed across frames, reducing load on the physics engine
        switch (impulseStateRef.current) {
            case "init":
                if (initialized) impulseStateRef.current = "initialImpulse";
                break;
                // Maybe we should wait for all entities to be registered - so state machines are syned
            // Should move this into useAnimateImpulses
            case "initialImpulse":
                if (config.initialImpulse) {
                    applyInitialImpulses();
                }
                impulseStateRef.current = "impulse";
                break
            case "impulse":
                prevCenterRef.current = node.depth == 0 ? initialPositionVector : centerRef.current;
                centerRef.current = internalRef.current.getCenter();
                if (centerRef.current && prevCenterRef.current) {
                    // Could calculate velocity and direction here
                    calculateImpulses(centerRef, prevCenterRef);
                    entityImpulses(prevCenterRef.current, impulseRef.current);
                }
                break;
            default:
                console.error("Unexpected state", id, impulseStateRef.current)
                break;
        }

    });

};

export default useAnimateImpulses;