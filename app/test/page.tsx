"use client"

import { FC, useEffect, useRef } from "react";
import { Square, Shape, Triangle, Circle } from "@/lib/mg/primitives";
import { AnimationScheduler, MGAnimation } from "@/lib/mg/animation";


function initializeCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        console.error("Failed to get 2D context")
        return
    }

    let blur = 10

    const square: Shape = new Square(100, {
        position: [250, 200],
        style: (ctx) => {
            ctx.fillStyle = "rgba(0, 0, 255, 0.5)"
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

    const scheduler = new AnimationScheduler(ctx, [square])
    scheduler.addAnimations(new MGAnimation([], [
        (dt) => {
            square.rotateBy(dt)
            triangle.rotateBy(-2 * dt)
        }
    ], [
        (u, v) => {
            square.setScale(u * 100 + 100)
            square.setPosition([u * 100 + 500, v * 100 + 500])

        }
    ]))
    scheduler.startAnimations()

    console.log("Canvas initialized")
}


const TestPage: FC = () => {
    const canvas = useRef(null);

    useEffect(() => {
        if (!canvas.current) {
            return
        }
        initializeCanvas(canvas.current)
    }, [canvas]);

    return (
        <div>
            <canvas ref={canvas} width={1000} height={1000} className={"border-zinc-700 border m-5"} />
        </div>
    )
}

export default TestPage