import { Sphere, CustomArrowHorizontal, CustomArrowVertical, CustomArrowDiagonal, CustomArrowTopUPbottomDown } from './components';

export const createSphere = (id, position, delay) => (
    <>
        <Sphere id={id} position={position} delay={delay} />
        <Sphere id={id} position={[position[0] +2, position[1] , position[2]]} delay={delay+ 1000} />
        <Sphere id={id} position={[position[0] , position[1] -2, position[2]]} delay={delay + 4000} />
        <Sphere id={id} position={[position[0] +2, position[1] -2, position[2]]} delay={delay + 4000} />
        <Sphere id={id} position={[position[0] +8, position[1] , position[2]]} delay={delay+ 7000} />
        <Sphere id={id} position={[position[0] +10, position[1] , position[2]]} delay={delay+ 7000} />
        <Sphere id={id} position={[position[0] +8, position[1] -2, position[2]]} delay={delay + 7000} />
        <Sphere id={id} position={[position[0] +10, position[1] -2, position[2]]} delay={delay + 7000} />    
    </>
  );
  export const createArrowHorizontal = (id, delay, start, end) => (
    <>
      <CustomArrowHorizontal id={id} delay={delay} start={start} end={end} />
      <CustomArrowHorizontal id={id} delay={delay + 2000} start={[start[0], 0, start[2]]} end={[end[0], 0, end[2]]} />
      <CustomArrowHorizontal id={id} delay={delay + 5000} start={[-start[0]+2, 2, start[2]]} end={[-end[0] +2, 2, end[2]]} />
      <CustomArrowHorizontal id={id} delay={delay + 5000} start={[-start[0] +2, 0, start[2]]} end={[-end[0] +2, 0, end[2]]} />
    </>
  );
  export const createArrowVertical = (id, delay, start, end) => (
    <>
      <CustomArrowVertical id={`${id}_1`} delay={delay} start={start} end={end} />
      <CustomArrowVertical id={`${id}_2`} delay={delay} start={[start[0] + 2, start[1], start[2]]} end={[end[0] + 2, end[1], end[2]]} />
      <CustomArrowVertical id={`${id}_3`} delay={delay + 3000} start={[-start[0], start[1], start[2]]} end={[-end[0], end[1], end[2]]} />
      <CustomArrowVertical id={`${id}_4`} delay={delay + 3000} start={[-start[0] + 2, start[1], start[2]]} end={[-end[0] + 2, end[1], end[2]]} />
    </>
  );
  export const createArrowDiagonal = (id, delay, start, end,type='diagonal') => (
    <>
      <CustomArrowDiagonal id={`${id}_1`} delay={delay} start={start} end={end} type={type} />
      <CustomArrowDiagonal id={`${id}_2`} delay={delay} start={[start[0] , start[1], start[2]]} end={[end[0] , end[1], end[2]]} type={"diagonal2"} />
      <CustomArrowDiagonal id={`${id}_3`} delay={delay + 3000} start={[-start[0] +2, start[1], start[2]]} end={[-end[0] + 2, end[1], end[2]]} type={type} />
      <CustomArrowDiagonal id={`${id}_4`} delay={delay + 3000} start={[-start[0] + 2, start[1], start[2]]} end={[-end[0] + 2, end[1], end[2]]} type={"diagonal2"} />
    </>
  );
  export const createBottomUpTopDown = (id, delay, start, end, type='Bottom_UP') => (
    <>
      <CustomArrowTopUPbottomDown id={id} delay={delay} start={[start[0] +1, start[1], start[2]]} end={[end[0]+1, end[1], end[2]]}  type={type} />
      <CustomArrowTopUPbottomDown id={id} delay={delay} start={[start[0] -1, start[1], start[2]]} end={[end[0]- 1, end[1], end[2]]}  type={type} />
      <CustomArrowTopUPbottomDown id={id} delay={delay} start={[start[0] +1, start[1]+2, start[2]]} end={[end[0]+1, end[1]+2, end[2]]}  type={type} />
      <CustomArrowTopUPbottomDown id={id} delay={delay} start={[start[0] -1, start[1]+2, start[2]]} end={[end[0]- 1, end[1]+2, end[2]]}  type={type} />
      <CustomArrowTopUPbottomDown id={`${id}_1`} delay={delay}  start={[-start[0] -1, start[1], start[2]]} end={[-end[0]-1, end[1], end[2]]} type={'top_DOWN'} />
      <CustomArrowTopUPbottomDown id={`${id}_2`} delay={delay} start={[-start[0] -1, start[1]+2, start[2]]} end={[-end[0]-1, end[1]+2, end[2]]} type={'top_DOWN'} />    
      <CustomArrowTopUPbottomDown id={`${id}_3`}delay={delay} start={[-start[0]+1, start[1]+2, start[2]]} end={[-end[0]+1, end[1]+2, end[2]]} type={'top_DOWN'} />
      <CustomArrowTopUPbottomDown id={`${id}_4`} delay={delay } start={[-start[0] + 1, start[1], start[2]]} end={[-end[0] + 1, end[1], end[2]]} type={'top_DOWN'} /> 
  
    </>
  );