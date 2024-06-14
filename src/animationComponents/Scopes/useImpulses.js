import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useEntityStore from './useEntityStore';

const useImpulses = (
    id,
    internalRef,
    entitiesRegisteredRef,
    indexArray,
    particleAreaRef,
    particleCount,
    config,
    scope,
) => {
    // Impulse that will be applied to Particles of this CompoundEntity
    const impulseRef = useRef();
    const impulsePerParticle = (config.impulsePerParticle || 0.02) * (scope + 1);

    const { getEntityRefs } = useEntityStore(state => ({
        getEntityRefs: state.getEntityRefs,
    }));

    const entityRefsArray = getEntityRefs(indexArray);

    const entityImpulses = (center, impulseIn) => {
        const impulse = impulseIn.clone();
        impulse.multiplyScalar(1 / entityRefsArray.length);
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
                        impulse.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCount / entityRefsArray.length);
                    }
                    const overshoot = displacement.length() - config.maxDisplacement;
                    if (overshoot > 0) {
                        impulse.copy(directionToCenter);
                        impulse.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCount / entityRefsArray.length);
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

    const applyInitialImpulses = (flattenedParticleRefs) => {
        const initialImpulseVectors = Array.from({ length: entityRefsArray.length }, () => new THREE.Vector3(
            (Math.random() - 0.5) * impulsePerParticle,
            (Math.random() - 0.5) * impulsePerParticle,
            0
        ));
        entityRefsArray.forEach((entity, i) => {
            if (entity.current) {
                const perEntityImpulse = initialImpulseVectors[i].multiplyScalar(flattenedParticleRefs.current.length);
                entity.current.addImpulse(perEntityImpulse);
            }
        });
    };

    const calculateImpulses = (centerRef, prevCenterRef) => {
        const displacement = centerRef.current.clone();
        displacement.sub(prevCenterRef.current);
        const impulseDirection = displacement.normalize();
        impulseRef.current = impulseDirection.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCount);
    };

    useFrame(() => {
        if (entitiesRegisteredRef.current === true) {
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

    return { entityImpulses, impulseRef, applyInitialImpulses, calculateImpulses };
};

export default useImpulses;