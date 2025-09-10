"use client"

import { FC, useEffect, useRef, useState } from "react";
import { loadModel } from "@/app/(kaleido)/model";
import { vectorOf } from "@/app/(kaleido)/linalg";
import { FaEraser } from "react-icons/fa";
import _ from "lodash";
import BezierEasing from "bezier-easing";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { getCenter, runOnLoadAndResize } from "@/app/(homepage)/(projects)/domFlower";

interface Props {
}

interface MnistCanvasProps {
}

interface KalaidoImageProps {
    src: string
    className?: string,
    style?: object,
    alt: string
    id?: string
}

function drawGrid(size: number, unit: number, blocks: number, ctx: CanvasRenderingContext2D) {
    for (let row = 0; row <= blocks; row++) {
        ctx.beginPath()
        ctx.moveTo(0, row * unit)
        ctx.lineTo(size, row * unit)

        ctx.strokeStyle = "#a1a1aa"
        ctx.stroke()
    }

    for (let col = 0; col <= blocks; col++) {
        ctx.beginPath()
        ctx.moveTo(col * unit, 0)
        ctx.lineTo(col * unit, size)

        ctx.strokeStyle = "#a1a1aa"
        ctx.stroke()
    }
}

const morph = 500
const maxWidth = 200

const updatePrediction = _.throttle((checkBoard, setPrediction) => {
    loadModel().then((model) => {
        const prediction = model.forward(vectorOf(checkBoard))
        setPrediction(prediction.data.flat())
    })
}, morph)

const MnistCanvas: FC<MnistCanvasProps> = () => {
    const cells = 28,
        cellSize = 20,
        canvasSize = cells * cellSize

    const canvas = useRef<HTMLCanvasElement>(null)
    const [checkBoard, setCheckBoard] = useState<number[]>(Array(cells * cells).fill(0))
    const [focus, setFocus] = useState([0, 0, 0])
    const [prediction, setPrediction] = useState<number[]>(Array(10).fill(0))

    let drawing = false

    const onDrawingListener = () => {
        drawing = true
    }
    const offDrawingListener = () => {
        drawing = false
    }
    const onMoveListener = (e: MouseEvent) => {
        if (!drawing || !canvas.current) {
            return
        }

        const boundingClientRect = canvas.current.getBoundingClientRect();
        const minX = boundingClientRect.left,
            maxX = boundingClientRect.width + minX,
            minY = boundingClientRect.top,
            maxY = boundingClientRect.height + minY

        if (minX > e.clientX || e.clientX > maxX || minY > e.clientY || e.clientY > maxY) {
            // out of bound
            return
        }

        const canvasX = e.clientX - minX,
            canvasY = e.clientY - minY,
            horizontalFocus = Math.floor(canvasX / cellSize),
            verticalFocus = Math.floor(canvasY / cellSize)

        setFocus([verticalFocus, horizontalFocus, 1])
    }

    function clearBoard() {
        const ctx = canvas.current?.getContext("2d")
        if (!ctx) {
            throw Error("Unable to acquire canvas 2d context")
        }
        ctx.clearRect(0, 0, canvasSize * window.devicePixelRatio, canvasSize * window.devicePixelRatio)
        setCheckBoard(Array(checkBoard.length).fill(0))
    }

    useEffect(() => {
        const [row, col, to] = focus

        const newArray = [...checkBoard]
        const index = row * cells + col;
        const leftIndex = index - 1;
        const rightIndex = index + 1;
        const downIndex = (row + 1) * cells + col;
        const upIndex = (row - 1) * cells + col;

        newArray[index] = to
        if (leftIndex >= 0 && Math.floor(leftIndex / cells) === Math.floor(index / cells)) {
            newArray[leftIndex] = to
        }
        if (rightIndex < newArray.length && Math.floor(rightIndex / cells) === Math.floor(index / cells)) {
            newArray[rightIndex] = to
        }
        if (downIndex < newArray.length) {
            newArray[downIndex] = to
        }
        if (upIndex >= 0) {
            newArray[upIndex] = to
        }
        setCheckBoard(newArray)
    }, [focus]);

    useEffect(() => {
        if (!canvas.current) {
            return
        }
        const ctx = canvas.current.getContext("2d")

        if (!ctx) {
            throw Error("Unable to acquire canvas 2d context")
        }

        ctx.clearRect(0, 0, canvasSize * window.devicePixelRatio, canvasSize * window.devicePixelRatio)

        for (let i = 0; i < checkBoard.length; i++) {
            if (!checkBoard[i]) {
                continue
            }
            const row = Math.floor(i / cells),
                col = i % cells,
                startX = col * cellSize * window.devicePixelRatio,
                startY = row * cellSize * window.devicePixelRatio

            ctx.fillStyle = "#6F52FF"
            ctx.fillRect(startX, startY, cellSize * window.devicePixelRatio, cellSize * window.devicePixelRatio)
        }

        drawGrid(canvasSize * window.devicePixelRatio, cellSize * window.devicePixelRatio, cells, ctx)

        updatePrediction(checkBoard, setPrediction)
    }, [checkBoard]);

    useEffect(() => {
        if (!canvas.current) {
            return
        }
        canvas.current.addEventListener("mousemove", onMoveListener)
        canvas.current.addEventListener("mousedown", onDrawingListener)
        document.addEventListener("mouseup", offDrawingListener)

        return () => {
            canvas.current?.removeEventListener("mousedown", onDrawingListener)
            canvas.current?.removeEventListener("mousemove", onMoveListener)
            document.removeEventListener("mouseup", offDrawingListener)
        }
    }, [canvas]);

    useEffect(() => {
        // morph original width to new width
        const dom = Array.from(document.querySelectorAll(".confidence")) as HTMLDivElement[]
        const currentWidths = dom.map((e) => e.clientWidth)
        const targetWidths = prediction.map((c) => maxWidth * c)

        // animation end
        setTimeout(() => {
            dom.forEach((e, i) => e.style.width = `${targetWidths[i]}px`)
        }, morph)

        const animationStart = Date.now()
        const ease = BezierEasing(0.25, 0.1, 0.25, 1)

        const animation = () => {
            const alpha = (Date.now() - animationStart) / morph
            if (alpha > 1 || alpha < 0) {
                return
            }
            const easedAlpha = ease(alpha)

            const frameWidths = targetWidths.map((target, i) => (target - currentWidths[i]) * easedAlpha + currentWidths[i])
            dom.forEach((e, i) => e.style.width = `${frameWidths[i]}px`)

            requestAnimationFrame(animation)
        }
        animation()

        const argmax = prediction.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)
        dom.forEach((e, i) =>
            i === argmax ? e.style.backgroundColor = "#6F52FF" : e.style.backgroundColor = ""
        )
    }, [prediction]);

    useEffect(() => {
        const listener = () => {
            if (!canvas.current) {
                return
            }

            canvas.current.width = canvas.current.height = canvasSize * window.devicePixelRatio
            const ctx = canvas.current.getContext("2d")

            if (!ctx) {
                throw Error("Unable to acquire canvas 2d context")
            }

            drawGrid(canvasSize * window.devicePixelRatio, cellSize * window.devicePixelRatio, cells, ctx)
        };
        listener()
        window.addEventListener("resize", listener)
        return () => window.removeEventListener("resize", listener)
    }, [])

    return (
        <div className="flex items-start gap-10 flex-grow-0">
            <div className="flex flex-col gap-2">
                <canvas ref={canvas} className="w-[560px] h-[560px] border-4 border-zinc-700"></canvas>
                <button type="button" onClick={clearBoard} title="Clear Canvas"
                        className="rounded-full self-start border-2 p-1 flex-grow-0 border-zinc-700 text-zinc-700 hover:border-theme hover:text-theme transition-all">
                    <FaEraser/>
                </button>
            </div>
            <div className="flex flex-col gap-4 mr-10">
                <div>
                    <h1 className="font-bold text-2xl mb-0 pb-0">MNIST MLP</h1>
                    <span className="text-zinc-500">(87% Accuracy)</span>
                </div>
                <hr className="border-zinc-300"/>
                <h3 className="font-bold text-xl font-mono">Prediction Confidence</h3>
                {prediction.map((_, i) => {
                    return (
                        <div className="flex gap-4" key={i}>
                            <span className="font-mono">{i}</span>
                            <div className="w-[200px]">
                                <div className="h-6 bg-zinc-600 w-20 confidence transition-background"/>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const KaleidoImage: FC<KalaidoImageProps> = ({ src, className, style, alt, id }) => {
    return (
        <img src={src}
             id={id}
             className={`max-w-[600px] hover:scale-105 transition-all duration-500 shadow-2xl max-h-[600px] rounded-md absolute right-[20%] ${className ?? ''}`}
             style={style} alt={alt}/>
    )
}

const Kaleido: FC<Props> = () => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

    useEffect(() => {
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: "#kalaido",
                start: "top top",
                end: "bottom bottom",
                scrub: 1
            }
        })
        timeline.to("#kalaido-pics", { opacity: 1, duration: 0.5 })
        timeline.to("#kalaido-pics", { opacity: 1, duration: 0.5 }, 1)
        timeline.to("#kalaido-pics", { filter: "blur(20px)", opacity: 0, zIndex: 0, duration: 1 }, 2)
        timeline.to("#mnist-canvas", { filter: "blur(0px)", opacity: 1, duration: 0.5 }, 2.5)
        timeline.to("#mnist-canvas", { filter: "blur(0px)", opacity: 1, duration: 1 })
    }, []);

    function flowImages() {
        const parent = document.getElementById("pics-container")!,
            { width, height } = parent.getBoundingClientRect()

        const {
            dom: codeImage,
            left: codeLeftCenter,
            top: codeTopCenter,
            width: codeWidth,
        } = getCenter("kalaido-code", width, height)

        const {
            dom: trainImage,
            left: trainLeftCenter,
            top: trainTopCenter,
            width: trainWidth,
            height: trainHeight
        } = getCenter("kalaido-train", width, height)

        const {
            dom: summaryImage,
            top: summaryTopCenter,
        } = getCenter("kalaido-summary", width, height)

        codeImage.style.left = `${codeLeftCenter - codeWidth / 2 - 10}px`
        codeImage.style.top = `${codeTopCenter - trainHeight * 0.3}px`

        trainImage.style.left = `${trainLeftCenter + trainWidth / 2 + 10}px`
        trainImage.style.top = `${trainTopCenter - trainHeight * 0.3}px`

        summaryImage.style.left = `${codeWidth / 2}px`
        summaryImage.style.top = `${summaryTopCenter + trainHeight * 0.7}px`
    }

    useEffect(() => {
        return runOnLoadAndResize(flowImages)
    })

    return (
        <section className="w-full h-[400vh]" id="kalaido">
            <div className="h-screen w-full z-10 sticky top-0">
                <div className="absolute right-20 h-full w-3/5 z-20 opacity-0 flex justify-center items-center"
                     id="kalaido-pics">
                    <div className="w-[800px] h-[800px] relative" id="pics-container">
                        <KaleidoImage id="kalaido-code" src="/images/kalaido.png" alt="Kalaido Code"
                                      style={{ maxWidth: 400 }}/>
                        <KaleidoImage id="kalaido-train" src="/images/loss.png" alt="Training" className="w-[450px]"/>
                        <KaleidoImage id="kalaido-summary" src="/images/summary.png" alt="Model Summary"/>
                    </div>
                </div>
                <div
                    className="absolute top-0 blur-lg opacity-0 right-0 flex flex-col justify-center items-center h-full w-2/3"
                    id="mnist-canvas">
                    <MnistCanvas/>
                </div>
            </div>
        </section>
    )
}

export default Kaleido