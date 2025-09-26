"use client"

import { onCanvasLoad } from "@/lib/flower";
import { constructCanvasLoadingFC } from "@/lib/threeHelper";

interface FlowerProps {
    className?: string
}

const Flower = constructCanvasLoadingFC<FlowerProps>(onCanvasLoad, (canvas, { className }) => {
    return (
        <div className={className}>
            {canvas}
        </div>
    )
}, {
    className: "w-full aspect-square"
})


export default Flower