import svgPath from 'svg-path-parser'

abstract class Path {
    abstract interpolate(t: number): [number, number];
    abstract scale(by: number): this;
}

class Line extends Path {
    startX: number
    startY: number
    endX: number
    endY: number

    constructor(startX: number,
                startY: number,
                endX: number,
                endY: number) {
        super()
        this.startX = startX
        this.startY = startY
        this.endX = endX
        this.endY = endY
    }

    interpolate(t: number): [number, number] {
        if (t < 0 || t > 1) {
            throw Error(`Invalid t '${t}', expected to be within 0-1`)
        }
        return [
            (1 - t) * this.startX + t * this.endX,
            (1 - t) * this.startY + t * this.endY
        ]
    }

    scale(by: number) {
        this.startX *= by
        this.startY *= by
        this.endX *= by
        this.endY *= by
        return this
    }
}

class QuadraticBezier extends Path {
    startX: number
    startY: number
    controlX: number
    controlY: number
    endX: number
    endY: number

    constructor(startX: number,
                startY: number,
                controlX: number,
                controlY: number,
                endX: number,
                endY: number) {
        super();

        this.startX = startX
        this.startY = startY
        this.controlX = controlX
        this.controlY = controlY
        this.endX = endX
        this.endY = endY
    }

    interpolate(t: number): [number, number] {
        return interpolateQuadraticArc(t, this.startX, this.startY, this.controlX, this.controlY, this.endX, this.endY);
    }

    scale(by: number) {
        this.startX *= by
        this.startY *= by
        this.controlX *= by
        this.controlY *= by
        this.endX *= by
        this.endY *= by
        return this
    }
}

class CubicBezier extends Path {
    startX: number
    startY: number
    control1X: number
    control1Y: number
    control2X: number
    control2Y: number
    endX: number
    endY: number

    constructor(startX: number,
                startY: number,
                control1X: number,
                control1Y: number,
                control2X: number,
                control2Y: number,
                endX: number,
                endY: number) {
        super();

        this.startX = startX
        this.startY = startY
        this.control1X = control1X
        this.control1Y = control1Y
        this.control2X = control2X
        this.control2Y = control2Y
        this.endX = endX
        this.endY = endY
    }

    interpolate(t: number): [number, number] {
        return interpolateCubicArc(t, this.startX, this.startY, this.control1X, this.control1Y, this.control2X, this.control2Y, this.endX, this.endY);
    }

    scale(by: number) {
        this.startX *= by
        this.startY *= by
        this.control1X *= by
        this.control1Y *= by
        this.control2X *= by
        this.control2Y *= by
        this.endX *= by
        this.endY *= by
        return this
    }
}

class ElementMapper {
    elements: (readonly [number, Path])[]

    constructor(elements: (readonly [number, Path])[]) {
        this.elements = elements
    }

    interpolate(t: number) {
        if (t < 0 || t > 1) {
            throw Error(`Invalid t '${t}', expected to be within 0-1`)
        }

        let target: readonly [number, Path]
        let targetDuration: number

        for (let i = 0; i < this.elements.length; i++) {
            if (this.elements[i][0] > t) {
                if (i === 0) {
                    targetDuration = this.elements[i][0]
                } else {
                    targetDuration = this.elements[i][0] - this.elements[i - 1][0]
                }
                target = this.elements[i]
                break
            }
            target = this.elements[i]
        }

        // @ts-ignore
        const targetTime = (t - target[0] + targetDuration) / targetDuration
        // @ts-ignore
        return target[1].interpolate(targetTime)
    }
}

/**
 * Get the length of a line using the Pythagorean Theorem
 *
 * @param startX
 * @param startY
 * @param endX
 * @param endY
 */
function linearLength(startX: number, startY: number, endX: number, endY: number) {
    return Math.sqrt((startX - endX) ** 2 + (startY - endY) ** 2)
}

/**
 * Approximate the length of a cubic Bézier curve
 * with n line segments.
 *
 * @param n
 * @param startX
 * @param startY
 * @param p1X
 * @param p1Y
 * @param p2X
 * @param p2Y
 * @param endX
 * @param endY
 */
function cubicArcLength(n: number, startX: number, startY: number, p1X: number, p1Y: number, p2X: number, p2Y: number, endX: number, endY: number) {
    if (n < 1) {
        throw Error(`Invalid n '${n}', expected to be an integer greater than 0`)
    }
    let length = 0
    for (let i = 0; i < n; i++) {
        const [x1, y1] = interpolateCubicArc((i + 1) / n, startX, startY, p1X, p1Y, p2X, p2Y, endX, endY)
        const [x2, y2] = interpolateCubicArc(i / n, startX, startY, p1X, p1Y, p2X, p2Y, endX, endY)
        length += linearLength(x1, y1, x2, y2)
    }
    return length
}

/**
 * Approximate a quadratic Bézier curve
 * with n line segments.
 *
 * @param n
 * @param startX
 * @param startY
 * @param pX
 * @param pY
 * @param endX
 * @param endY
 */
function quadraticArcLength(n: number, startX: number, startY: number, pX: number, pY: number, endX: number, endY: number) {
    if (n < 1) {
        throw Error(`Invalid n '${n}', expected to be an integer greater than 0`)
    }
    let length = 0
    for (let i = 0; i < n; i++) {
        const [x1, y1] = interpolateQuadraticArc((i + 1) / n, startX, startY, pX, pY, endX, endY)
        const [x2, y2] = interpolateQuadraticArc(i / n, startX, startY, pX, pY, endX, endY)
        length += linearLength(x1, y1, x2, y2)
    }
    return length
}

/**
 * LERP through the cubic Bézier curve, interpolate the coordinate
 * with t in [0, 1]
 *
 * @param t
 * @param startX
 * @param startY
 * @param p1X
 * @param p1Y
 * @param p2X
 * @param p2Y
 * @param endX
 * @param endY
 */
function interpolateCubicArc(t: number, startX: number, startY: number, p1X: number, p1Y: number, p2X: number, p2Y: number, endX: number, endY: number): [number, number] {
    if (t < 0 || t > 1) {
        throw Error(`Invalid t '${t}', expected to be within 0-1`)
    }

    const xs = [startX, p1X, p2X, endX]
    const ys = [startY, p1Y, p2Y, endY]

    const polynomials = [
        -(t ** 3) + 3 * t ** 2 - 3 * t + 1,
        3 * t ** 3 - 6 * t ** 2 + 3 * t,
        -3 * t ** 3 + 3 * t ** 2,
        t ** 3
    ]

    return polynomials
        .map((prod, i): [number, number] => [prod * xs[i], prod * ys[i]])
        .reduce(([prevX, prevY], [currX, currY]) => [prevX + currX, prevY + currY], [0, 0])
}

/**
 * LERP through the quadratic Bézier curve, interpolate the coordinate
 * with t in [0, 1]
 *
 * @param t
 * @param startX
 * @param startY
 * @param pX
 * @param pY
 * @param endX
 * @param endY
 */
function interpolateQuadraticArc(t: number, startX: number, startY: number, pX: number, pY: number, endX: number, endY: number): [number, number] {
    if (t < 0 || t > 1) {
        throw Error(`Invalid t '${t}', expected to be within 0-1`)
    }

    const xs = [startX, pX, endX]
    const ys = [startY, pY, endY]

    const polynomials = [
        (1 - t) ** 2,
        2 * t * (1 - t),
        t ** 2
    ]

    return polynomials
        .map((prod, i): [number, number] => [prod * xs[i], prod * ys[i]])
        .reduce(([prevX, prevY], [currX, currY]) => [prevX + currX, prevY + currY], [0, 0])
}

/**
 * Generate the vector originating at (endX, endY),
 * pointing to the opposite direction of the original vector
 *
 * @param startX
 * @param startY
 * @param endX
 * @param endY
 */
function oppositeVector(startX: number, startY: number, endX: number, endY: number): [number, number] {
    return [2 * endX - startX, 2 * endY - startY]
}

/**
 * Parse the svg paths, and then acquire the circumference.
 *
 * @param svg
 * @param scale
 */
export function analyzeCurve(svg: SVGElement, scale: number = 1) {
    const paths = Array.from(svg.getElementsByTagName("path"))
        .map(path => path.getAttribute("d")) as string[]

    let circumference: number;
    const elements: [number, Path][] = []

    paths.forEach((path) => {
        const pathCommands = svgPath.parseSVG(path)

        let x = 0, y = 0;

        // absolute value of where the implied handle is
        let smoothX: number, smoothY: number;
        let params;

        pathCommands.forEach((command) => {
            switch (command.code) {
                case "m":
                    x += command.x
                    y += command.y
                    break
                case "M":
                    x = command.x
                    y = command.y
                    break
                case "L":
                    elements.push([linearLength(x, y, command.x, command.y), new Line(x, y, command.x, command.y)])
                    x = command.x
                    y = command.y
                    break
                case "l":
                    elements.push([linearLength(0, 0, command.x, command.y), new Line(x, y, command.x + x, command.y + y)])
                    x += command.x
                    y += command.y
                    break
                case "V":
                    elements.push([Math.abs(command.y - y), new Line(x, y, x, command.y)])
                    y = command.y
                    break
                case "v":
                    elements.push([Math.abs(command.y), new Line(x, y, x, command.y + y)])
                    y += command.y
                    break
                case "H":
                    elements.push([Math.abs(command.x - x), new Line(x, y, command.x, y)])
                    x = command.x
                    break
                case "h":
                    elements.push([Math.abs(command.x), new Line(x, y, x + command.x, y)])
                    x += command.x
                    break
                case "C":
                    params = [x, y, command.x1, command.y1, command.x2, command.y2, command.x, command.y] as const
                    elements.push([cubicArcLength(60, ...params), new CubicBezier(...params)])
                    x = command.x
                    y = command.y;
                    ([smoothX, smoothY] = oppositeVector(command.x2, command.y2, command.x, command.y))
                    break
                case "c":
                    params = [x, y, command.x1 + x, command.y1 + y, command.x2 + x, command.y2 + y, command.x + x, command.y + y] as const
                    elements.push([cubicArcLength(60, ...params), new CubicBezier(...params)])
                    x += command.x
                    y += command.y;
                    ([smoothX, smoothY] = oppositeVector(command.x2 + x, command.y2 + y, command.x + x, command.y + y))
                    break
                case "Q":
                    params = [x, y, command.x1, command.y1, command.x, command.y] as const
                    elements.push([quadraticArcLength(60, ...params), new QuadraticBezier(...params)])
                    x = command.x
                    y = command.y;
                    ([smoothX, smoothY] = oppositeVector(command.x1, command.y1, command.x, command.y))
                    break
                case "q":
                    params = [x, y, command.x1 + x, command.y1 + y, command.x + x, command.y + y] as const
                    elements.push([quadraticArcLength(60, ...params), new QuadraticBezier(...params)])
                    x += command.x
                    y += command.y;
                    ([smoothX, smoothY] = oppositeVector(command.x1 + x, command.y1 + y, command.x + x, command.y + y))
                    break
                case "S":
                    params = [x, y, smoothX, smoothY, command.x2, command.y2, command.x, command.y] as const
                    elements.push([cubicArcLength(60, ...params), new CubicBezier(...params)]);
                    ([smoothX, smoothY] = oppositeVector(command.x2, command.y2, command.x, command.y))
                    x = command.x
                    y = command.y
                    break
                case "s":
                    params = [x, y, smoothX, smoothY, command.x2 + x, command.y2 + x, command.x + x, command.y + x] as const
                    elements.push([cubicArcLength(60, ...params), new CubicBezier(...params)]);
                    ([smoothX, smoothY] = oppositeVector(command.x2 + x, command.y2 + y, command.x + x, command.y + y))
                    x += command.x
                    y += command.y
                    break
                case "T":
                    params = [x, y, smoothX, smoothY, command.x, command.y] as const
                    elements.push([quadraticArcLength(60, ...params), new QuadraticBezier(...params)]);
                    ([smoothX, smoothY] = oppositeVector(smoothX, smoothY, command.x, command.y))
                    x = command.x
                    y = command.y
                    break
                case "t":
                    params = [x, y, smoothX, smoothY, command.x + x, command.y + y] as const
                    elements.push([quadraticArcLength(60, ...params), new QuadraticBezier(...params)]);
                    ([smoothX, smoothY] = oppositeVector(smoothX, smoothY, command.x + x, command.y + y))
                    x += command.x
                    y += command.y
                    break
                case "Z":
                    break
                default:
                    throw Error(`Unknown command '${command.code}'`)
            }
        })
    })

    const scaledElements = elements.map((e): [number, Path] => [e[0] * scale, e[1].scale(scale)])
    circumference = scaledElements
        .map(e => e[0])
        .reduce((a, b) => a + b, 0)

    const normalizedElements = scaledElements.map((e): [number, Path] => [e[0] / circumference, e[1]])

    let prev = 0;
    for (let i = 0; i < normalizedElements.length - 1; i++) {
        normalizedElements[i][0] += prev
        prev = normalizedElements[i][0]
    }
    normalizedElements[normalizedElements.length - 1][0] = 1

    return new ElementMapper(normalizedElements)
}

/**
 * Exp of complex number
 *
 * @param real
 * @param imag
 */
export function expComplex(real: number, imag: number): [number, number] {
    const magnitude = Math.exp(real);
    return [magnitude * Math.cos(imag), magnitude * Math.sin(imag)]
}

/**
 * Multiply 2 complex numbers
 *
 * @param p1
 * @param p2
 */
export function multiplyComplex(p1: [number, number], p2: [number, number]): [number, number] {
    const real = p1[0] * p2[0] - p1[1] * p2[1]
    const imag = p1[0] * p2[1] + p1[1] * p2[0]
    return [real, imag]
}

/**
 * Add 2 complex numbers
 *
 * @param p1
 * @param p2
 */
export function addComplex(p1: [number, number], p2: [number, number]): [number, number] {
    return [p1[0] + p2[0], p1[1] + p2[1]]
}

export function fourierCoefficients(elements: ElementMapper, vectorCount: number, samples: number = 10000) {
    if (samples < 0 || vectorCount < 0) {
        throw Error()
    }

    const dt = 1 / samples
    const timeSamples = [...Array(Math.floor(1 / dt)).keys()].map(i => i * dt) // np.arange(0, 1, dt)
    const pathSamples: [number, number][] = []

    for (const t of timeSamples) {
        pathSamples.push(elements.interpolate(t))
    }

    const freqs: number[] = []
    for (let i = 0; i < vectorCount; i++) {
        freqs.push(i - Math.floor(vectorCount / 2))
    }
    freqs.sort((a, b) => Math.abs(a) - Math.abs(b))

    const result: { [key: number]: [number, number]} = {}
    for (const freq of freqs) {
        let riemannSum: [number, number] = [0, 0]
        for (let i = 0; i < timeSamples.length; i++) {
            const time = timeSamples[i]
            const point = pathSamples[i]
            const m = multiplyComplex(expComplex(0, -2 * Math.PI * freq * time), point)
            riemannSum = addComplex(m, riemannSum)
        }
        riemannSum = [riemannSum[0] * dt, riemannSum[1] * dt]
        result[freq] = riemannSum
    }

    return result
}