// reliable way to get mouse position
import { Shape } from "@/lib/mg/primitives";

class MouseTracker {
    x: number = 0
    y: number = 0

    constructor() {
        window.addEventListener("mousemove", (event) => {
            this.x = event.clientX
            this.y = event.clientY
        })
    }

    getPosition() {
        return [this.x / window.innerWidth, this.y / window.innerHeight] as const
    }
}


// reliable way to get time delta
class TimeTracker {
    lastTime: number = performance.now()

    getDelta() {
        const now = performance.now()
        const delta = now - this.lastTime
        this.lastTime = now
        return delta / 1000
    }

    reset() {
        this.lastTime = performance.now()
    }
}


// top level animation scheduler
export class AnimationScheduler {
    alpha: number = 0
    handler: number = 0
    running: boolean = false
    mouseTracker = new MouseTracker()
    timeTracker = new TimeTracker()

    constructor(public ctx: CanvasRenderingContext2D,
                public objects: Shape[] = [],
                public animations: MGAnimation[] = []) {
    }

    addAnimations(...animations: MGAnimation[]) {
        this.animations.push(...animations)
        return this
    }

    addObjects(...objects: Shape[]) {
        this.objects.push(...objects)
        return this
    }

    stopAnimations() {
        if (!this.running) {
            return
        }
        cancelAnimationFrame(this.handler)
        this.running = false
    }

    tick(newAlpha: number) {
        if (newAlpha < 0 || newAlpha > 1) {
            // assume scrolling out of bounds
            this.stopAnimations()
            return
        }

        if (!this.running) {
            this.alpha = newAlpha
            this.startAnimations()
        }
    }

    startAnimations() {
        if (this.running) {
            return
        }
        this.running = true
        this.timeTracker.reset()

        const step = () => {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
            const dt = this.timeTracker.getDelta()
            const [u, v] = this.mouseTracker.getPosition()
            for (const animation of this.animations) {
                animation.update(this.alpha, dt, u, v)
            }
            for (const object of this.objects) {
                object.renderAllTo(this.ctx)
            }

            this.handler = requestAnimationFrame(step)
        }

        this.handler = requestAnimationFrame(step)
    }
}


export class MGAnimation {
    alpha: number = -1
    activeChildren: number[] = []

    constructor(public alphaAnimations: ((alpha: number) => void)[] = [],
                public idleAnimations: ((dt: number) => void)[] = [],
                public interactiveAnimations: ((u: number, v: number) => void)[] = [],
                public children: [number, number, MGAnimation][] = []) {
    }

    addAlphaAnimations(...animations: ((alpha: number) => void)[]) {
        this.alphaAnimations.push(...animations)
        return this
    }

    addIdleAnimations(...animations: (() => void)[]) {
        this.idleAnimations.push(...animations)
        return this
    }

    addInteractiveAnimations(...animations: ((u: number, v: number) => void)[]) {
        this.interactiveAnimations.push(...animations)
        return this
    }

    addChild(start: number, end: number, child: MGAnimation) {
        this.children.push([start, end, child])
        if (start <= this.alpha && this.alpha <= end) {
            this.activeChildren.push(this.children.length - 1)
        }
        return this
    }

    update(alpha: number, dt: number, u: number, v: number) {
        if (alpha !== this.alpha) {
            this.alpha = alpha
            for (const animation of this.alphaAnimations) {
                animation(alpha)
            }
            // update active children
            const newActiveChildren: number[] = []
            for (let i = 0; i < this.children.length; i++) {
                const [start, end, child] = this.children[i]
                if (start <= alpha && alpha <= end) {
                    newActiveChildren.push(i)
                }
            }

            for (const i of newActiveChildren) {
                const [start, end, child] = this.children[i]
                const localAlpha = (alpha - start) / (end - start)
                child.update(localAlpha, dt, u, v)
            }
            this.activeChildren = newActiveChildren
        }

        for (const animation of this.idleAnimations) {
            animation(dt)
        }

        for (const animation of this.interactiveAnimations) {
            animation(u, v)
        }
    }
}