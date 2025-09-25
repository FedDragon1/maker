// reliable way to get mouse position
import { Shape } from "@/lib/mg/primitives";
import { zip } from "@/lib/nodes/utils";
import colorRgba from 'color-rgba';

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

    set newAlpha(newAlpha: number) {
        if ((newAlpha < 0 || newAlpha >= 1)) {
            // assume scrolling out of bounds
            this.alpha = Math.min(Math.max(newAlpha, 0), 1)
            if (this.running) {
                this.step()
            }
            this.stopAnimations()
            return
        }

        this.alpha = newAlpha
        if (!this.running) {
            this.startAnimations()
        }
    }

    step() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        const dt = this.timeTracker.getDelta()
        const [u, v] = this.mouseTracker.getPosition()
        for (const animation of this.animations) {
            animation.update(this.alpha, dt, u, v)
        }
        for (const object of this.objects) {
            object.renderAllTo(this.ctx)
        }
    }

    startAnimations() {
        if (this.running) {
            return
        }
        this.running = true
        this.timeTracker.reset()

        const loop = () => {
            this.step()
            if (this.running) {
                this.handler = requestAnimationFrame(loop)
            }
        }
        requestAnimationFrame(loop)
    }
}


export class MGAnimation {
    alphaAnimations: ((alpha: number) => void)[]
    idleAnimations: ((dt: number) => void)[]
    interactiveAnimations: ((u: number, v: number) => void)[]
    children: [number, number, MGAnimation][]
    rateFn: (alpha: number) => number

    alpha: number = -1
    activeChildren: number[] = []

    constructor(spec: {
        alphaAnimations?: ((alpha: number) => void)[],
        idleAnimations?: ((dt: number) => void)[],
        interactiveAnimations?: ((u: number, v: number) => void)[],
        children?: [number, number, MGAnimation][],
        rateFn?: (alpha: number) => number
    } = {
        alphaAnimations: [],
        idleAnimations: [],
        interactiveAnimations: [],
        children: [],
        rateFn: (alpha) => alpha
    }) {
        this.alphaAnimations = spec.alphaAnimations ?? []
        this.idleAnimations = spec.idleAnimations ?? []
        this.interactiveAnimations = spec.interactiveAnimations ?? []
        this.children = spec.children ?? []
        this.rateFn = spec.rateFn ?? ((alpha) => alpha)
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
        alpha = this.rateFn(alpha)
        this.alpha = alpha
        for (const animation of this.alphaAnimations) {
            animation(alpha)
        }
        // update active children
        const newActiveChildren: number[] = []
        for (let i = 0; i < this.children.length; i++) {
            const [start, end, _] = this.children[i]
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

        for (const animation of this.idleAnimations) {
            animation(dt)
        }

        for (const animation of this.interactiveAnimations) {
            animation(u, v)
        }
    }
}


class CtxStyleExtractor {
    globalAlpha: number = 1
    globalCompositeOperation: CanvasCompositing["globalCompositeOperation"] = 'source-over'
    fillStyle: string | CanvasGradient | CanvasPattern = "transparent"
    strokeStyle: string | CanvasGradient | CanvasPattern = "#000"
    lineWidth: number = 1
    lineCap: CanvasLineCap = 'butt'
    lineJoin: CanvasLineJoin = 'miter'
    miterLimit: number = 10
    lineDash: number[] = []
    lineDashOffset: number = 0
    shadowColor: string = 'rgba(0,0,0,0)'
    shadowBlur: number = 0
    shadowOffsetX: number = 0
    shadowOffsetY: number = 0
    imageSmoothingEnabled: boolean = true
    imageSmoothingQuality: ImageSmoothingQuality = 'low'
    font: string = '10px sans-serif'
    textAlign: CanvasTextAlign = 'start'
    textBaseline: CanvasTextBaseline = 'alphabetic'
    direction: CanvasDirection = 'inherit'
    filter: string = 'none'
    transform: DOMMatrix = new DOMMatrix([1, 0, 0, 1, 0, 0])

    setLineDash(segments: number[]) {
        this.lineDash = segments
    }

    getLineDash() {
        return this.lineDash
    }

    setTransform(a: number, b: number, c: number, d: number, e: number, f: number) {
        this.transform = new DOMMatrix([a, b, c, d, e, f])
    }

    resetTransform() {
        this.transform = new DOMMatrix([1, 0, 0, 1, 0, 0])
    }

    beginPath() {}
}

type AlphaFn<R> = (alpha: number) => R

type ClassProperties<C> = {
    [Key in keyof C as C[Key] extends Function ? never : Key]: C[Key];
};

function gcd(a: number, b: number) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

function lcm(a: number, b: number) {
    if (a === 0 || b === 0) {
        return 0;
    }
    return Math.abs(a * b) / gcd(a, b);
}

function interpolateNumber(a: number, b: number): AlphaFn<number> {
    return (alpha: number) => a * (1 - alpha) + b * alpha
}

function interpolateGradiantable(a: string | CanvasGradient | CanvasPattern,
                                 b: string | CanvasGradient | CanvasPattern): AlphaFn<string | CanvasGradient | CanvasPattern> {
    if (typeof a === "string" && typeof b === "string") {
        const ca = colorRgba(a)
        const cb = colorRgba(b)
        if (ca.length === 4 && cb.length === 4) {
            return (alpha: number) => {
                const r = Math.round(ca[0] * (1 - alpha) + cb[0] * alpha)
                const g = Math.round(ca[1] * (1 - alpha) + cb[1] * alpha)
                const b = Math.round(ca[2] * (1 - alpha) + cb[2] * alpha)
                const a = ca[3] * (1 - alpha) + cb[3] * alpha
                return `rgba(${r}, ${g}, ${b}, ${a})`
            }
        }
    }

    // fallback to step function
    return (alpha: number) => alpha < 0.5 ? a : b
}

function interpolateLineDash(a: number[], b: number[]): AlphaFn<number[]> {
    if (a.length === 0) {
        a = [0]
    }
    if (b.length === 0) {
        b = [0]
    }
    const newLength = lcm(a.length, b.length)
    console.log(a, b, newLength)
    const aExtended = Array.from({ length: newLength }, (_, i) => a[i % a.length])
    const bExtended = Array.from({ length: newLength }, (_, i) => b[i % b.length])
    return (alpha: number) => aExtended.map((v, i) => v * (1 - alpha) + bExtended[i] * alpha)
}

function interpolateDOMMatrix(a: DOMMatrix, b: DOMMatrix): AlphaFn<DOMMatrix> {
    return (alpha: number) => {
        const aArr = [a.a, a.b, a.c, a.d, a.e, a.f]
        const bArr = [b.a, b.b, b.c, b.d, b.e, b.f]
        const cArr = aArr.map((v, i) => v * (1 - alpha) + bArr[i] * alpha)
        return new DOMMatrix(cArr)
    }
}

function interpolateStep<T>(a: T, b: T): AlphaFn<T> {
    return (alpha: number) => alpha < 0.5 ? a : b
}


export class MGTransition extends MGAnimation {
    constructor(public from: Shape, public to: Shape, params: {
        points?: boolean,
        scale?: boolean,
        rotation?: boolean,
        position?: boolean,
        style?: boolean,
        rateFn?: (alpha: number) => number
        styleAttributes?: { [i in keyof ClassProperties<CtxStyleExtractor>]?: boolean }
    } = {
        points: true,
        scale: true,
        rotation: true,
        position: true,
        style: true,
    }) {
        super({
            rateFn: params.rateFn
        });

        if (params.points) {
            const sync = Math.max(from.points.length, to.points.length)
            const fOriginalPts = from.points
            const fromPoints = from.resamplePoints(sync)
            const toPoints = to.resamplePoints(sync)


            const customRenderer = from.renderImpl.bind(from)
            const overridingRenderer = Shape.prototype.renderImpl.bind(from)
            const toRenderer = to.renderImpl.bind(from)
            this.addAlphaAnimations((alpha) => {
                if (alpha <= 0) {
                    from.points = fOriginalPts
                    from.renderImpl = customRenderer
                    return
                }
                if (alpha >= 1) {
                    from.points = to.points
                    from.renderImpl = toRenderer
                    return
                }

                from.renderImpl = overridingRenderer
                const points = zip(fromPoints, toPoints)
                    .map(([[p1x, p1y], [p2x, p2y]]) => [
                        p1x * (1 - alpha) + p2x * alpha,
                        p1y * (1 - alpha) + p2y * alpha
                    ] as [number, number])
                from.points = Array.from(points)
            })
        }

        if (params.scale) {
            const fromScale = from.scale
            this.addAlphaAnimations((alpha) => {
                from.setScale(fromScale * (1 - alpha) + to.scale * alpha)
            })
        }

        if (params.rotation) {
            const fromRotation = from.rotation
            this.addAlphaAnimations((alpha) => {
                from.setRotation(fromRotation * (1 - alpha) + to.rotation * alpha)
            })
        }

        if (params.position) {
            const fromPosition = from.position
            this.addAlphaAnimations((alpha) => {
                from.setPosition([
                    fromPosition[0] * (1 - alpha) + to.position[0] * alpha,
                    fromPosition[1] * (1 - alpha) + to.position[1] * alpha
                ] as [number, number])
            })
        }

        if (params.style) {
            const fsCopy = from.styleFn

            const fromStyle = new CtxStyleExtractor()
            const toStyle = new CtxStyleExtractor()
            from.styleFn(fromStyle as unknown as CanvasRenderingContext2D)
            to.styleFn(toStyle as unknown as CanvasRenderingContext2D);


            const attributeFns: { [i in keyof ClassProperties<CtxStyleExtractor>]: AlphaFn<CtxStyleExtractor[i]> } = {
                globalAlpha: interpolateNumber(fromStyle.globalAlpha, toStyle.globalAlpha),
                fillStyle: interpolateGradiantable(fromStyle.fillStyle, toStyle.fillStyle),
                strokeStyle: interpolateGradiantable(fromStyle.strokeStyle, toStyle.strokeStyle),
                lineWidth: interpolateNumber(fromStyle.lineWidth, toStyle.lineWidth),
                miterLimit: interpolateNumber(fromStyle.miterLimit, toStyle.miterLimit),
                lineDash: interpolateLineDash(fromStyle.getLineDash(), toStyle.getLineDash()),
                lineDashOffset: interpolateNumber(fromStyle.lineDashOffset, toStyle.lineDashOffset),
                shadowColor: interpolateGradiantable(fromStyle.shadowColor, toStyle.shadowColor) as AlphaFn<string>,
                shadowBlur: interpolateNumber(fromStyle.shadowBlur, toStyle.shadowBlur),
                shadowOffsetX: interpolateNumber(fromStyle.shadowOffsetX, toStyle.shadowOffsetX),
                shadowOffsetY: interpolateNumber(fromStyle.shadowOffsetY, toStyle.shadowOffsetY),
                transform: interpolateDOMMatrix(fromStyle.transform, toStyle.transform),
                lineCap: interpolateStep(fromStyle.lineCap, toStyle.lineCap),
                lineJoin: interpolateStep(fromStyle.lineJoin, toStyle.lineJoin),
                font: interpolateStep(fromStyle.font, toStyle.font),
                textAlign: interpolateStep(fromStyle.textAlign, toStyle.textAlign),
                textBaseline: interpolateStep(fromStyle.textBaseline, toStyle.textBaseline),
                direction: interpolateStep(fromStyle.direction, toStyle.direction),
                filter: interpolateStep(fromStyle.filter, toStyle.filter),
                imageSmoothingEnabled: interpolateStep(fromStyle.imageSmoothingEnabled, toStyle.imageSmoothingEnabled),
                imageSmoothingQuality: interpolateStep(fromStyle.imageSmoothingQuality, toStyle.imageSmoothingQuality),
                globalCompositeOperation: interpolateStep(fromStyle.globalCompositeOperation, toStyle.globalCompositeOperation),
            }

            const attributes: ClassProperties<CtxStyleExtractor> = {
                globalAlpha: fromStyle.globalAlpha,
                fillStyle: fromStyle.fillStyle,
                strokeStyle: fromStyle.strokeStyle,
                lineWidth: fromStyle.lineWidth,
                miterLimit: fromStyle.miterLimit,
                lineDash: fromStyle.getLineDash(),
                lineDashOffset: fromStyle.lineDashOffset,
                shadowColor: fromStyle.shadowColor,
                shadowBlur: fromStyle.shadowBlur,
                shadowOffsetX: fromStyle.shadowOffsetX,
                shadowOffsetY: fromStyle.shadowOffsetY,
                transform: fromStyle.transform,
                // attributes below are not animated, just step function
                lineCap: fromStyle.lineCap,
                lineJoin: fromStyle.lineJoin,
                font: fromStyle.font,
                textAlign: fromStyle.textAlign,
                textBaseline: fromStyle.textBaseline,
                direction: fromStyle.direction,
                filter: fromStyle.filter,
                imageSmoothingEnabled: fromStyle.imageSmoothingEnabled,
                imageSmoothingQuality: fromStyle.imageSmoothingQuality,
                globalCompositeOperation: fromStyle.globalCompositeOperation,
            }

            const newFn = (ctx: CanvasRenderingContext2D) => {
                for (const [key, val] of Object.entries(attributes)) {
                    // @ts-ignore
                    if (key === "lineDash") {
                        ctx.setLineDash(val as number[])
                    } else if (key === "transform") {
                        const m = val as DOMMatrix
                        ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f)
                    } else {
                        // @ts-ignore
                        ctx[key] = val
                    }
                }
            }

            const toStyleResolved = (ctx: CanvasRenderingContext2D) => {
                to.styleFn(ctx)
                const ctxStyleExtractor = new CtxStyleExtractor();
                fsCopy(ctxStyleExtractor as unknown as CanvasRenderingContext2D)

                for (const [key, override] of Object.entries(params.styleAttributes || {})) {
                    // @ts-ignore
                    if (override === false) {
                        // @ts-ignore
                        ctx[key] = ctxStyleExtractor[key as keyof CtxStyleExtractor]
                    }
                }
            }

            this.addAlphaAnimations((alpha) => {
                if (alpha <= 0) {
                    from.style(fsCopy)
                    return
                }
                if (alpha >= 1) {
                    from.style(toStyleResolved)
                    return
                }
                from.style(newFn)
                for (const [key, fn] of Object.entries(attributeFns)) {
                    // @ts-ignore
                    if (params.styleAttributes && params.styleAttributes[key] === false) {
                        const ctxStyleExtractor = new CtxStyleExtractor();
                        fsCopy(ctxStyleExtractor as unknown as CanvasRenderingContext2D)
                        // @ts-ignore
                        attributes[key] = ctxStyleExtractor[key as keyof CtxStyleExtractor]
                        continue
                    }
                    // @ts-ignore
                    attributes[key] = fn(alpha)
                }
            })
        }
    }
}