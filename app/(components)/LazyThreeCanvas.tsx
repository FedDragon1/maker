"use client"

import React, { FC, useEffect, useRef, useState } from "react";
import { AnimatedEnvironment, Environment } from "@/utils/three/environment";

interface Canvas {
    init: (environment: Environment, canvas: HTMLCanvasElement) => void;
    load: (environment: Environment) => void;
    constructor: typeof Environment
    onDestroy?: (environment: Environment) => void;
    className?: string;
    id?: string
    rootMargin?: number
    bypassObserver?: boolean
}

const LazyThreeCanvas: FC<Canvas> = ({ init, constructor, className, bypassObserver, id, onDestroy, rootMargin, load}) => {
    const ref = useRef<HTMLDivElement>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [environment, setEnvironment] = useState<Environment | null>(null)

    useEffect(() => {
        if (!canvasRef.current) {
            return
        }

        const env = new constructor({
            antialias: true,
            canvas: canvasRef.current,
        }, bypassObserver)
        setEnvironment(env);
        init(env, canvasRef.current)
        env.attachResizeListener()

        return () => {
            if (env instanceof AnimatedEnvironment) {
                env.stopFrameByFrameRendering()
            }
            if (onDestroy) {
                onDestroy(env)
            }
        }
    }, [onDestroy, init, constructor, canvasRef])

    useEffect(() => {
        if (!environment) {
            return
        }
        if (!rootMargin) {
            rootMargin = 3 * window.innerHeight
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    load(environment)
                    observer.disconnect(); // Stop observing once the component is visible
                }
            },
            { rootMargin: `${rootMargin}px` }
        );

        if (ref.current) observer.observe(ref.current);

        return () => observer.disconnect();
    }, [rootMargin, environment]);

    return (
        <div className="w-full h-full" ref={ref}>
            <canvas ref={canvasRef} id={id ?? ''} className={className ?? ''}/>
        </div>
    )
}

export default LazyThreeCanvas