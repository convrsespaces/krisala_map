import React from 'react';
import { mark_blackout } from '../data/marks';
import { useBlackout } from '../hooks';

function Blackout() {

    const {blackout} = useBlackout();


    return (
        <g className={`transition-all ${(blackout) ? "opacity-2": "opacity-0"}`} style={{zIndex:"1", pointerEvents: "none"}}>
          <g className={`overlay-can-hide`} >
           {mark_blackout}
          </g>
          </g>
    );
}

export default Blackout;