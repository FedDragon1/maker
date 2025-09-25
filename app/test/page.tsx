"use client"

import { FC, useEffect, useRef } from "react";
import { Square, Shape, Triangle, Circle } from "@/lib/mg/primitives";
import { AnimationScheduler, MGAnimation } from "@/lib/mg/animation";
import Transition1 from "@/app/(composed)/(2_transition1)/Transition1";


function initializeCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        console.error("Failed to get 2D context")
        return
    }

    let red = 0
    let green = 0

    const square: Shape = new Square(100, {
        position: [250, 200],
        style: (ctx) => {
            ctx.fillStyle = `rgba(${red}, ${green}, 0, 0.5)`
            ctx.strokeStyle = "blue"
            ctx.lineWidth = 3
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
            ctx.shadowBlur = 10
            ctx.shadowOffsetX = 5
            ctx.shadowOffsetY = 5
        }
    }).scaleBy(1.5)
    const triangle: Shape = new Triangle(50, {
        position: [100, 100]
    }).scaleBy(2).centerToPoint([100, 100])
    square.addChildren(triangle)

    const circle = new Circle(100, {
        position: [400, 400],
        style: (ctx) => {
            ctx.fillStyle = "rgba(255, 0, 0, 0.3)"
            ctx.strokeStyle = "red"
            ctx.lineWidth = 5
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
            ctx.shadowBlur = 15
            ctx.shadowOffsetX = 10
            ctx.shadowOffsetY = 10
        }
    });
    triangle.addChildren(circle)


    console.log("Canvas initialized")
}


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
        <Transition1/>
    )
}

export default TestPage