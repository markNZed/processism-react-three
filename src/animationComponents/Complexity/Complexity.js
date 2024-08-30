import React, {  useRef, useMemo, useState } from 'react';
import withAnimationState from '../../withAnimationState';
import _ from 'lodash';
import CompoundEntity from './CompoundEntity'
import useAnimateComplexity from './useAnimateComplexity';
import PhysicsController from './PhysicsController';
import useConfigPanel from './useConfigPanel';
import useStoreEntity from './useStoreEntity';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* Overview:
  Animation framework intended to provide a visual language for representing complexity.
  A set of particles form a CompoundEntity and a set of CompoundEntity form a new CompoundEntity etc
  This represents the concept of emergent entities
  Each CompoundEntity has joints that connect entity/Particle to form a "soft body"

  useStoreEntity has a node for each entity/Particle 
    node.ref is a pointer to the Three group of a CompoundEntity or Rapier RigidBody of a Particle
    node.ref.current.physicsConfig holds information that impact the rendering
      This is under the ref so we can access this information when dealing with Rapier particles

*/

/*
 requestAnimationFrame aims to achieve a refresh rate of 60 frames per second (FPS). 
 Each frame has 16.67 milliseconds for all the rendering and updates to occur.
*/

// Be careful with just using props because the HOC adds props e.g. simulationReady which will cause rerendering
// Using forwardRef because withAnimationState expects this
const Complexity = React.forwardRef(({id}, ref) => {

    const rootOneRef = useRef();
    const rootOneCenterRef = useRef(new THREE.Vector3());
    const frameStateRef = useRef("init");
    const [showTwo, setShowTwo] = useState(false);

    const initialCreationPathOne = [[0, 0, 50], [0, 0, 25]];
    const initialCreationPathTwo = [[0, 0, 50], [0, 0, -5]];

    const storeOne = useMemo(() => useStoreEntity(), []);
    const storeTwo = useMemo(() => useStoreEntity(), []);

    const refOne = useRef();
    const refTwo = useRef();

    const config = useConfigPanel({ radius: 50, color: "blue" });

    // An array of array providing structure with number as the number of leaf nodes
    let entityCountsOne = [
        [  
            [  
                3
            ],
            [  
                4
            ],
            [  
                5
            ],
        ],
        [  
            [  
                4
            ],
            [  
                4
            ],
            [  
                4
            ],
        ],
        [  
            [  
                5
            ],
            [  
                5
            ],
            [  
                5
            ],
        ],
        [  
            [  
                5
            ],
            [  
                5
            ],
            [  
                5
            ],
        ],
        [  
            [  
                5
            ],
            [  
                5
            ],
            [  
                5
            ],
        ],
    ];

    let entityCountsTwo = [
        [  
            [  
                3
            ],
            [  
                3
            ],
            [  
                3
            ],
        ],
        [  
            [  
                3
            ],
            [  
                3
            ],
            [  
                3
            ],
        ],
        [  
            [  
                3
            ],
            [  
                3
            ],
            [  
                3
            ],
        ],
    ];

    entityCountsOne = [3, 3, 3, 3];
    //entityCountsTwo = [];
    //entityCountsTwo = [3, 3, 3];

    // Build entityCountsOne from symmetrical config
    let entityCountsSymmetricalOne;
    entityCountsSymmetricalOne = [3, 3, 3]
    
    function buildEntityCounts(entityCountsSymmetrical) { 
        const entityCountsOne = [];   
        if (entityCountsSymmetrical.length === 1) {
            return entityCountsSymmetrical[0];
        } else {
            let top = entityCountsSymmetrical.shift();
            for (let i = 0; i < top; i++) {
                entityCountsOne.push(buildEntityCounts([...entityCountsSymmetrical]));
            }
        }
        return entityCountsOne;
    }
    if (entityCountsSymmetricalOne) {
        entityCountsOne = buildEntityCounts(entityCountsSymmetricalOne);
        console.log("buildEntityCounts:", entityCountsOne);
    }

    const configOne = {...config, entityCounts: entityCountsOne, entityStore: storeOne, initialCreationPath: initialCreationPathOne};
    const configTwo = {...config, entityCounts: entityCountsTwo, entityStore: storeTwo, initialCreationPath: initialCreationPathTwo};

    const {storeEntityReady: storeEntityOneReady} = useAnimateComplexity(configOne, refOne);
    const {storeEntityReady: storeEntityTwoReady} = useAnimateComplexity(configTwo, refTwo);
    
    console.log("Complexity rendering", id, storeEntityOneReady, storeOne.getState(), config)

    // Pass in radius so we can pass on new radius for child CompoundEntity
    // Pass in initialPosition to avoid issues with prop being reinitialized with default value

    useFrame(() => {
        // Get the center of 
        if (rootOneRef.current) {
            rootOneCenterRef.current = rootOneRef.current.current.getCenterWorld();
            initialCreationPathOne.forEach(path => {
                path[0] = rootOneCenterRef.current.x;
                path[1] = rootOneCenterRef.current.y;
            })
            initialCreationPathTwo.forEach(path => {
                path[0] = rootOneCenterRef.current.x;
                path[1] = rootOneCenterRef.current.y;
            })
        }

        switch (frameStateRef.current) {
            case "init": {
                if (storeEntityOneReady) {
                    if (!rootOneRef.current) {
                        const rootOneNode = storeOne.getState().getNode("root");
                        rootOneRef.current = rootOneNode.ref;
                        frameStateRef.current = "waitRootOne";
                    }
                }
                break;
            }
            case "waitRootOne": {
                const physicsConfig = rootOneRef.current.current.getPhysicsConfig();
                if (physicsConfig.visible) {
                    frameStateRef.current = "done";
                    if (entityCountsTwo.length > 0) setShowTwo(true);
                }
                break;
            }
            cas
            case "done": {
                break;
            }
            default:
                console.error("Unexpected state in Complexity", frameStateRef.current)
                break;
        }
    });

    return (
        <group ref={ref} >
            <PhysicsController config={config} />
            {storeEntityOneReady && (
                <CompoundEntity
                    id={"root"}
                    ref={refOne}
                    radius={configOne.radius}
                    initialPosition={[0, 0, 0]}
                    config={configOne}
                />
            )}
            {showTwo && storeEntityTwoReady && (
                <CompoundEntity
                    id={"root"}
                    ref={refTwo}
                    radius={configTwo.radius}
                    initialPosition={[0, 0, -25]}
                    config={configTwo}
                />
            )}
        </group>
    );
});

export default withAnimationState(Complexity);
