import { FC, useEffect, useRef } from "react";
import { Circle, Triangle } from "@/lib/mg/primitives";
import { AnimationScheduler, MGAnimation, MGTransition } from "@/lib/mg/animation";

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerCanvasResizeListener2d } from "@/lib/threeHelper";

gsap.registerPlugin(ScrollTrigger)


const initializeCanvas = (ctx: CanvasRenderingContext2D) => {
    let shadowOffsetX = 0,
        shadowOffsetY = 0

    const circle = new Circle(200)
        .centerToPoint([ctx.canvas.width / 2, ctx.canvas.height / 2])
        .style((ctx) => {
            ctx.fillStyle = "black"
            ctx.strokeStyle = "transparent"
            ctx.shadowBlur = Math.abs(shadowOffsetY) + Math.abs(shadowOffsetX)
            ctx.shadowOffsetX = shadowOffsetX
            ctx.shadowOffsetY = shadowOffsetY
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
        })

    let dashOffset = 0;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * 2 * Math.PI
        const x = Math.cos(angle) * 200 + ctx.canvas.width / 2
        const y = Math.sin(angle) * 200 + ctx.canvas.height / 2
        const smallCircle = new Circle(60)
            .centerToPoint([x, y])
            .style((ctx) => {
                ctx.fillStyle = "transparent"
                ctx.strokeStyle = "black"
                ctx.lineWidth = 2
                ctx.setLineDash([10, 5])
                ctx.lineDashOffset = dashOffset
                ctx.shadowBlur = 20
                ctx.shadowOffsetX = 2
                ctx.shadowOffsetY = 2
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
            })
        circle.addChildren(smallCircle)
    }

    const triangle = new Triangle(200)
        .translateBy([ctx.canvas.width / 2, ctx.canvas.height / 2])
        .style((ctx) => {
            ctx.setLineDash([10, 5, 2])
            ctx.shadowColor = "blue"
            ctx.shadowBlur = 20
        })

    const animationScheduler = new AnimationScheduler(ctx, [circle])
    animationScheduler.addAnimations(new MGTransition(circle, triangle, {
        scale: true,
        position: true,
        points: true,
        style: true,
        styleAttributes: {
            shadowBlur: false,
            shadowOffsetX: false,
            shadowOffsetY: false,
        }
    }), new MGAnimation({
        idleAnimations: [
            (dt) => {
                dashOffset -= dt * 50
                circle.rotateBy(dt)
            }
        ],
        interactiveAnimations: [
            (u, v) => {
                shadowOffsetX = -(u - 0.5) * 20
                shadowOffsetY = -(v - 0.5) * 20
            }
        ]
    }), )
    animationScheduler.startAnimations()

    gsap.to(animationScheduler, {
        newAlpha: 1,
        scrollTrigger: {
            trigger: "#transition-1",
            start: "top top",
            end: "bottom bottom",
            markers: true,
            scrub: 1,
        }
    })

    // ScrollTrigger.create({
    //     trigger: "#transition-1",
    //     start: "top top",
    //     end: "bottom top",
    //     markers: true,
    //     scrub: 1,
    //     onUpdate: (self) => {
    //         animationScheduler.tick(self.progress)
    //     }
    // })
}

const Transition1: FC = () => {
    const canvas = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvas.current) {
            return
        }
        const ctx = canvas.current.getContext("2d")
        if (!ctx) {
            console.error("Failed to get 2D context")
            return
        }

        canvas.current.width = canvas.current.clientWidth
        canvas.current.height = canvas.current.clientHeight

        const resizeCleanUp = registerCanvasResizeListener2d(canvas.current)
        initializeCanvas(ctx)

        return resizeCleanUp
    }, [canvas]);

    return (
        <>
            <div className={"w-screen h-[200vh] relative"} id={"transition-1"}>
                <canvas className={"w-screen h-screen aspect-square sticky top-0"} ref={canvas}/>
            </div>
            <div className={"h-screen"} ></div>
        </>

    )
}

export default Transition1