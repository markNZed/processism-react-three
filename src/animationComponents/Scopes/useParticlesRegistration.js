import { useCallback, useRef, useState } from 'react';
import { calculateCircleArea } from './utils';

const useParticlesRegistration = (props, index, scope, id, config) => {
    const entityParticlesRefsRef = useRef(Array.from({ length: config.entityCounts[scope] }, () => useRef([])));
    const particlesRegisteredRef = useRef(Array.from({ length: config.entityCounts[scope] }, () => false));
    const entitiesRegisteredRef = useRef(false);
    const flattenedParticleRefs = useRef();
    const particleAreaRef = useRef();
    const particleRadiusRef = useRef();
    const [particleCount, setParticleCount] = useState()


    const areAllParticlesRegistered = useCallback(() => {
        return particlesRegisteredRef.current.every(ref => ref === true);
    }, []);

    const registerParticlesFn = useCallback((entityIndex, particleRefs, particleRadius) => {
        entityParticlesRefsRef.current[entityIndex].current = [...entityParticlesRefsRef.current[entityIndex].current, ...particleRefs];
        particleRadiusRef.current = particleRadius;
        particlesRegisteredRef.current[entityIndex] = true;

        if (areAllParticlesRegistered() && !entitiesRegisteredRef.current) {
            entitiesRegisteredRef.current = true;
            flattenedParticleRefs.current = entityParticlesRefsRef.current.flatMap(refs => refs.current);

            setParticleCount(flattenedParticleRefs.current.length);

            if (props.registerParticlesFn) {
                props.registerParticlesFn(index, flattenedParticleRefs.current, particleRadius);
            }

            particleAreaRef.current = calculateCircleArea(particleRadius);

            if (scope === 0) {
                console.log(`All particles (radius: ${particleRadiusRef.current}m) are registered`, id, flattenedParticleRefs.current.length);
            }
        }
    }, [areAllParticlesRegistered, props, index, scope, id]);

    return { registerParticlesFn, entityParticlesRefsRef, entitiesRegisteredRef, flattenedParticleRefs, particleCount, particleAreaRef, particleRadiusRef, areAllParticlesRegistered };
};

export default useParticlesRegistration;
