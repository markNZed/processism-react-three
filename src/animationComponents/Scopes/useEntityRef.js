import { useEffect, useRef, useCallback } from 'react';
import useEntityStore from './useEntityStore';

const useEntityRef = (props, index, indexArray, internalRef, entityRefsArray) => {
    const childGetEntityRefFnRef = useRef([]);
    const { getEntityRefs } = useEntityStore();

    const getEntityRefFn = useCallback((path) => {
        // Check if this Compound Entity is on the path
        for (let i = 0; i < indexArray.length; i++) {
            const val = indexArray[i];
            if (val !== path[i]) {
                // Need to broaden scope (call getEntityRefFn in parent)
                return props.getEntityRefFn(path);
            }
        }
        // We have a match so return the ref of this CompoundEntity
        if (path.length === indexArray.length) {
            return internalRef;
        }
        // Return an entity of this CompoundEntity
        if (path.length === indexArray.length + 1) {
            const entityIndex = path[path.length - 1];
            return entityRefsArray[entityIndex];
        }
        // Need to narrow the scope (call getEntityRefFn in child)
        const childIndex = path[indexArray.length];
        return childGetEntityRefFnRef.current[childIndex](path);
    }, [indexArray, internalRef, props, entityRefsArray]);

    const registerGetEntityRefFn = useCallback((childIndex, method) => {
        childGetEntityRefFnRef.current[childIndex] = method;
    }, []);

    useEffect(() => {
        if (props.registerGetEntityRefFn) {
            props.registerGetEntityRefFn(index, getEntityRefFn);
        }
    }, [props.registerGetEntityRefFn, getEntityRefFn, index]);

    return {
        getEntityRefFn,
        registerGetEntityRefFn,
    };
};

export default useEntityRef;
