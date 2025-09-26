import * as THREE from "three";
import { EffectComposer } from "postprocessing";
import { FC, ReactNode, useCallback, useEffect, useState } from "react";
import { onCanvasLoad } from "@/lib/flower";

function registerCanvasResizeListenerImpl(canvasResizeListener: () => void) {
    canvasResizeListener()

    window.addEventListener("resize", canvasResizeListener)

    let pxRatio = window.devicePixelRatio || window.screen.availWidth / document.documentElement.clientWidth;

    function isZooming() {
        const newPxRatio = window.devicePixelRatio || window.screen.availWidth / document.documentElement.clientWidth;
        if (newPxRatio != pxRatio) {
            pxRatio = newPxRatio;
            return true
        }
        return false
    }

    let handle: number;

    function rafZoom() {
        if (isZooming()) {
            canvasResizeListener()
        }
        handle = requestAnimationFrame(rafZoom)
    }

    rafZoom()

    return () => {
        window.removeEventListener("resize", canvasResizeListener)
        cancelAnimationFrame(handle)
    }
}

export function registerCanvasResizeListener2d(canvas: HTMLCanvasElement) {
    return registerCanvasResizeListenerImpl(() => {
        canvas.style.width = ""
        canvas.style.height = ""
        const { width, height } = canvas.getBoundingClientRect()
        canvas.width = width
        canvas.height = height
    })
}

export function registerCanvasResizeListener(obj: {
    canvas: HTMLCanvasElement,
    renderer: THREE.WebGLRenderer,
    composer: EffectComposer,
    camera: THREE.PerspectiveCamera
}) {
    return registerCanvasResizeListenerImpl(() => {
        const {
            canvas,
            renderer,
            composer,
            camera
        } = obj

        canvas.style.width = ""
        canvas.style.height = ""
        const { width, height } = canvas.getBoundingClientRect()
        canvas.width = width
        canvas.height = height

        renderer.setSize(width, height)
        composer.setSize(width, height)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
    })
}

export function registerMouseMoveListener(canvas: HTMLCanvasElement, callback: (u: number, v: number) => void) {
    const listener = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()

        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const u = mouseX / rect.width
        const v = mouseY / rect.height

        callback(u, v)
    }

    document.addEventListener("mousemove", listener)

    return () => document.removeEventListener("mousemove", listener)
}

export function constructCanvasLoadingFC<Props>(callback: (canvas: HTMLCanvasElement) => void,
                                                body: (canvasNode: ReactNode, props: Props) => ReactNode,
                                                canvasProps?: { [k in string]: any}): FC<Props> {
    return (props: Props) => {
        const [canvas, setCanvas] = useState<HTMLCanvasElement>()
        const canvasCallback = useCallback((node: HTMLCanvasElement | null) => {
            if (node) {
                setCanvas(node)
            }
        }, [])

        useEffect(() => {
            if (!canvas) {
                return
            }

            console.log("ThreeCanvas Loaded")
            const onUnload = onCanvasLoad(canvas)

            return () => {
                console.log("ThreeCanvas Unmounting...")
                onUnload()
            }
        }, [canvas]);

        const node = <canvas ref={canvasCallback} {...canvasProps} />
        return body(node, props)
    }

}