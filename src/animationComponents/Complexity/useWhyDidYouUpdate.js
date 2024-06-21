import { useEffect, useRef } from 'react';

// Custom hook to log render causes
const useWhyDidYouUpdate = (name, props) => {
    const previousProps = useRef();

    useEffect(() => {
        let found = false;
        if (previousProps.current) {
            const allKeys = Object.keys({ ...previousProps.current, ...props });
            const changesObj = {};
            allKeys.forEach((key) => {
                if (previousProps.current[key] !== props[key]) {
                    changesObj[key] = {
                        from: previousProps.current[key],
                        to: props[key]
                    };
                }
            });

            if (Object.keys(changesObj).length) {
                console.log(`[${name}] re-rendered due to changes in props:`, changesObj);
                found = true;
            }
        }

        previousProps.current = props;

    });
};

export default useWhyDidYouUpdate;