type Point = [number, number]

const defaultStyle = (ctx: CanvasRenderingContext2D) => {
    if (typeof ctx.resetTransform === 'function') {
        ctx.resetTransform();
    } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // clear current path
    ctx.beginPath();

    // drawing state
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // styles
    ctx.fillStyle = 'transparent';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 10;
    ctx.setLineDash([]);           // clear dashes
    ctx.lineDashOffset = 0;

    // shadows
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // image smoothing
    try {
        ctx.imageSmoothingEnabled = true;
    } catch (e) {
    }
    try {
        ctx.imageSmoothingQuality = 'low';
    } catch (e) {
    }

    // text
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    try {
        ctx.direction = 'inherit';
    } catch (e) {
    }

    // filters
    try {
        ctx.filter = 'none';
    } catch (e) {
    }
}


export class Shape {
    points: Point[]
    closed: boolean
    position: Point
    children: Shape[]
    scale: number
    rotation: number
    hidden: boolean = false
    styleFn: (ctx: CanvasRenderingContext2D) => void

    constructor(points: Point[],
                closed: boolean = false,
                position: Point = [0, 0],
                children: Shape[] = [],
                scale: number = 1,
                rotation: number = 0,
                style: (ctx: CanvasRenderingContext2D) => void = defaultStyle) {
        this.points = points;
        this.closed = closed;
        this.position = position;
        this.children = children;
        this.scale = scale;
        this.rotation = rotation
        this.styleFn = style
    }

    interpolatePoint(t: number) {
        if (t <= 0 || (t >= 1 && this.closed)) {
            return this.points[0]
        }
        if (t >=1) {
            return this.points[this.points.length - 1]
        }

        const lengths = []
        for (let i = 0; i < this.points.length - 1; i++) {
            const [x1, y1] = this.points[i]
            const [x2, y2] = this.points[i + 1]
            lengths.push(Math.hypot(x2 - x1, y2 - y1))
        }
        if (this.closed) {
            const [x1, y1] = this.points[this.points.length - 1]
            const [x2, y2] = this.points[0]
            lengths.push(Math.hypot(x2 - x1, y2 - y1))
        }
        const totalLength = lengths.reduce((a, b) => a + b, 0)
        const targetLength = t * totalLength

        let cumLength = 0
        for (let i = 0; i < lengths.length; i++) {
            if (cumLength + lengths[i] >= targetLength) {
                const [x1, y1] = this.points[i]
                const [x2, y2] = this.points[(i + 1) % this.points.length]
                const segmentLength = lengths[i]
                const segmentT = (targetLength - cumLength) / segmentLength
                return [
                    x1 + (x2 - x1) * segmentT,
                    y1 + (y2 - y1) * segmentT
                ] as Point
            }
            cumLength += lengths[i]
        }

        return this.points[this.points.length - 1]
    }

    resamplePoints(numPoints: number) {
        const newPoints: Point[] = []
        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1)
            newPoints.push(this.interpolatePoint(t))
        }
        return newPoints
    }

    renderTo(ctx: CanvasRenderingContext2D) {
        if (this.hidden) {
            return
        }

        this.renderImpl(ctx)

        ctx.stroke();
        ctx.fill();
    }

    renderImpl(ctx: CanvasRenderingContext2D) {
        const canvasSpacePoints = this.points.map(([x, y]) => [
            (x * Math.cos(this.rotation) - y * Math.sin(this.rotation)) * this.scale + this.position[0],
            (x * Math.sin(this.rotation) + y * Math.cos(this.rotation)) * this.scale + this.position[1]
        ] as const)

        this.styleFn(ctx)
        ctx.beginPath();
        ctx.moveTo(...canvasSpacePoints[0]);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(...canvasSpacePoints[i]);
        }
        if (this.closed) {
            ctx.closePath();
        }
    }

    renderAllTo(ctx: CanvasRenderingContext2D) {
        this.renderTo(ctx);
        for (const child of this.children) {
            child.renderAllTo(ctx);
        }
    }

    addChildren(...children: Shape[]) {
        this.children.push(...children)
        return this
    }

    centroid() {
        let xSum = 0, ySum = 0;
        for (const [x, y] of this.points) {
            xSum += x;
            ySum += y;
        }
        return [xSum / this.points.length * this.scale + this.position[0],
            ySum / this.points.length * this.scale + this.position[1]] as Point;
    }

    centerToPoint(point: Point) {
        const currentCentroid = this.centroid(),
            offsetX = point[0] - currentCentroid[0],
            offsetY = point[1] - currentCentroid[1]

        return this.setPosition([this.position[0] + offsetX, this.position[1] + offsetY])
    }

    rotateFromPoint(point: Point, angle: number) {
        const s = Math.sin(angle)
        const c = Math.cos(angle)

        // Translate point back to origin:
        let posX = this.position[0] - point[0]
        let posY = this.position[1] - point[1]

        // Rotate point
        const newX = posX * c - posY * s
        const newY = posX * s + posY * c

        // Translate point back:
        this.position = [newX + point[0], newY + point[1]]
        this.rotation += angle

        this.children.forEach(child => child.rotateFromPoint(point, angle))
        return this
    }

    scaleFromPoint(point: Point, factor: number) {
        const posX = (this.position[0] - point[0]) * factor
        const posY = (this.position[1] - point[1]) * factor

        this.position = [posX + point[0], posY + point[1]]
        this.scale *= factor

        this.children.forEach(child => child.scaleFromPoint(point, factor))
        return this
    }

    scaleBy(factor: number) {
        return this.setScale(this.scale * factor)
    }

    rotateBy(angle: number) {
        return this.setRotation(this.rotation + angle)
    }

    translateBy(offset: Point) {
        return this.setPosition([this.position[0] + offset[0], this.position[1] + offset[1]])
    }

    setRotation(angle: number) {
        this.children.forEach(child => child.rotateFromPoint(this.position, angle - this.rotation))
        this.rotation = angle
        return this
    }

    setScale(factor: number) {
        if (factor === 0) {
            this.hidden = true
            return this
        }
        this.hidden = false
        const scale = factor / this.scale
        this.scale = factor
        this.children.forEach(child => child.scaleFromPoint(this.position, scale))
        return this
    }

    setPosition(position: Point) {
        this.children.forEach(child => child.translateBy([position[0] - this.position[0], position[1] - this.position[1]]))
        this.position = position
        return this
    }

    style(styleFn: (ctx: CanvasRenderingContext2D) => void) {
        this.styleFn = styleFn
        return this
    }
}


export class Square extends Shape {
    constructor(size: number,
                params?: {
                    position?: Point,
                    children?: Shape[],
                    rotation?: number,
                    style?: (ctx: CanvasRenderingContext2D) => void
                }) {
        super(
            [
                [-0.5, -0.5],
                [0.5, -0.5],
                [0.5, 0.5],
                [-0.5, 0.5]
            ],
            true,
            params?.position,
            params?.children,
            size,
            params?.rotation,
            params?.style
        );
    }
}


export class Triangle extends Shape {
    constructor(size: number,
                params?: {
                    position?: Point,
                    children?: Shape[],
                    rotation?: number,
                    style?: (ctx: CanvasRenderingContext2D) => void
                }) {
        super(
            [
                [0.5, 0.5 / Math.sqrt(3)],
                [-0.5, 0.5 / Math.sqrt(3)],
                [0, -1 / Math.sqrt(3)]
            ],
            true,
            params?.position,
            params?.children,
            size,
            params?.rotation,
            params?.style
        );
    }
}


export class Circle extends Shape {
    constructor(public diameter: number,
                params?: {
                    position?: Point,
                    numSegments?: number,
                    children?: Shape[],
                    rotation?: number,
                    style?: (ctx: CanvasRenderingContext2D) => void
                }) {
        const points: Point[] = [];
        const numSegments = params?.numSegments ?? 64
        for (let i = 0; i < numSegments; i++) {
            const angle = (i / numSegments) * 2 * Math.PI;
            points.push([Math.cos(angle), Math.sin(angle)]);
        }
        super(points, true, params?.position, params?.children, diameter, params?.rotation, params?.style);
    }

    interpolatePoint(t: number): [number, number] {
        const angle = t * 2 * Math.PI;
        return [
            Math.cos(angle) / 2,
            Math.sin(angle) / 2
        ];
    }

    renderImpl(ctx: CanvasRenderingContext2D) {
        this.styleFn(ctx)
        ctx.beginPath();
        ctx.arc(this.position[0], this.position[1], this.scale / 2, 0, 2 * Math.PI);
    }
}