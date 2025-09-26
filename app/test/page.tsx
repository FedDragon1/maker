"use client"

import { FC, } from "react";
import Transition1 from "@/app/(composed)/(2_transition1)/Transition1";
import Transition3 from "@/app/(composed)/(6_transition3)/Transition3";


const TestPage: FC = () => {
    // const canvas = useRef(null);
    //
    // useEffect(() => {
    //     if (!canvas.current) {
    //         return
    //     }
    //     initializeCanvas(canvas.current)
    // }, [canvas]);

    return (
        // <div>
        //     <canvas ref={canvas} width={1000} height={1000} className={"border-zinc-700 border m-5"} />
        // </div>
        // <Transition1/>
        <Transition3 />
    )
}

export default TestPage