import { useRef, useCallback } from 'react';

const useLimitedLog = (limit = 100) => {
    const logCountRef = useRef(0);

    const limitedLog = useCallback((...args) => {
        if (logCountRef.current < limit) {
            console.log(...args);
            logCountRef.current += 1;
        }
    }, [limit]);

    return limitedLog;
};

export default useLimitedLog;
