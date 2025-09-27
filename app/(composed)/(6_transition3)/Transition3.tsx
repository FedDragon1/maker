import { FC, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
    registerCanvasResizeListener,
    registerCanvasResizeListenerImpl,
    registerMouseMoveListener
} from "@/lib/threeHelper";
import { EffectComposer, RenderPass } from "postprocessing";

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Flower } from "@/lib/flower";
import { AxesHelper } from "three";
import Transition1 from "@/app/(composed)/(2_transition1)/Transition1";
import { mulberry32 } from "@/lib/nodes/utils";

async function loadModel(): Promise<THREE.Mesh> {
    const loader = new GLTFLoader()
    return new Promise((resolve, reject) => {
        loader.load(
            '/models/finger.glb',
            (gltf: any) => {
                // @ts-ignore
                resolve(gltf.scene.children[0]);
            },
            undefined,
            reject
        );
    });
}

class Finger extends THREE.Object3D {
    constructor(op: (object: THREE.Mesh) => THREE.Object3D) {
        super()

        loadModel().then((object) => {
            this.add(op(object))
        })
    }
}

class Counter {
    private count: number = 0

    next() {
        return this.count++
    }
}

function fnv1a32(n: number) {
    const str = n.toString()
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0; // unsigned 32-bit
}


const humanTexts = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()[]{};:,.<>?/|\\'\"`~"

function onCanvasLoad(canvasAi: HTMLCanvasElement,
                      canvasTarget: HTMLCanvasElement,
                      canvasHuman: HTMLCanvasElement,
                      gridSize: [number, number]) {
    // const canvasAi = document.createElement("canvas")    // TODO in the end use this
    const canvasAi2d = document.createElement("canvas")
    const ctxAi2d = canvasAi2d.getContext("2d")!

    // intermediate canvas
    const canvasHuman2d = document.createElement("canvas")
    const ctxHuman2d = canvasHuman2d.getContext("2d")!

    // final canvas
    const ctxTarget = canvasTarget.getContext("2d")!

    // AI part setup
    const aiAspRatio = canvasAi.clientWidth / canvasAi.clientHeight
    const aiScene = new THREE.Scene()
    const aiCamera = new THREE.PerspectiveCamera(75, aiAspRatio, 0.1, 1000)
    const aiRenderer = new THREE.WebGLRenderer({
        canvas: canvasAi,
        alpha: true,
        antialias: false
    })
    aiCamera.position.set(0, 0, 4);

    const pointLight1 = new THREE.PointLight(0xff77ff, 10)
    pointLight1.position.set(-2, 2, 2)
    aiScene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x77ffff, 20)
    pointLight2.position.set(-2, 2, -2)
    aiScene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0xffff77, 20)
    pointLight3.position.set(0, -4, 0)
    aiScene.add(pointLight3)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
    aiScene.add(ambientLight)

    const aiFinger = new Finger((object) => {
        object.geometry.scale(0.5, 0.5, 0.5)
        object.geometry.rotateY(-Math.PI / 2)
        object.geometry.translate(-3, 0, 0)
        return object
    })
    aiScene.add(aiFinger)

    const aiComposer = new EffectComposer(aiRenderer, {
        frameBufferType: THREE.FloatType
    })
    aiComposer.addPass(new RenderPass(aiScene, aiCamera))

    // Human part setup
    const humanAspRatio = canvasAi.clientWidth / canvasAi.clientHeight
    const humanScene = new THREE.Scene()
    const humanCamera = new THREE.PerspectiveCamera(75, humanAspRatio, 0.1, 1000)
    const humanRenderer = new THREE.WebGLRenderer({
        canvas: canvasHuman,
        alpha: true,
        antialias: false
    })
    humanCamera.position.set(0, 0, 4);

    const humanFinger = new Finger((object) => {
        const geometry = object.geometry
            .scale(0.5, 0.5, 0.5)
            .rotateY(Math.PI / 2)
            .translate(3, 0, 0)
        return new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 0.01,
            color: 0x000000
        }))
    })
    humanScene.add(humanFinger)

    const humanComposer = new EffectComposer(humanRenderer, {
        frameBufferType: THREE.FloatType
    })
    humanComposer.addPass(new RenderPass(humanScene, humanCamera))


    const aiFingerFacadeResizeCleanUp = registerCanvasResizeListenerImpl(() => {
        canvasHuman2d.style.width = canvasTarget.style.width = canvasAi2d.style.width =
            canvasAi.style.width = ""
        canvasHuman2d.style.height = canvasTarget.style.height = canvasAi2d.style.height =
            canvasAi.style.height = ""
        let { width, height } = canvasTarget.getBoundingClientRect()

        canvasTarget.width = width;
        canvasTarget.height = height;

        width /= gridSize[0]
        height = Math.ceil(height / (gridSize[1]));
        const gridAsp = gridSize[0] / gridSize[1]
        canvasHuman2d.width = canvasHuman.width = canvasAi2d.width = canvasAi.width = width
        canvasHuman2d.height = canvasHuman.height = canvasAi2d.height = canvasAi.height = height

        aiRenderer.setSize(width * gridAsp, height)
        aiComposer.setSize(width * gridAsp, height)
        aiCamera.aspect = width / height * gridAsp
        aiCamera.updateProjectionMatrix()

        humanRenderer.setSize(width * gridAsp, height)
        humanComposer.setSize(width * gridAsp, height)
        humanCamera.aspect = width / height * gridAsp
        humanCamera.updateProjectionMatrix()
    })
    const moveCleanUp = registerMouseMoveListener(canvasAi, (u, v) => {

    })

    const aiControls = new OrbitControls(aiCamera, aiRenderer.domElement);
    const humanControls = new OrbitControls(humanCamera, humanRenderer.domElement);

    let handle: number;
    const counter = new Counter()

    function render() {
        const currentFrame = counter.next()
        handle = requestAnimationFrame(render)
        aiControls.update()
        humanControls.update()

        aiComposer.render()
        humanComposer.render()

        ctxAi2d.clearRect(0, 0, canvasAi2d.width, canvasAi2d.height)
        ctxTarget.clearRect(0, 0, canvasTarget.width, canvasTarget.height)
        ctxHuman2d.clearRect(0, 0, canvasHuman2d.width, canvasHuman2d.height)

        ctxAi2d.drawImage(canvasAi, 0, 0, canvasAi2d.width, canvasAi2d.height)
        const aiImageData = ctxAi2d.getImageData(0, 0, canvasAi2d.width, canvasAi2d.height)
        for (let y = 0; y < canvasAi2d.height; y++) {
            for (let x = 0; x < canvasAi2d.width; x++) {
                const offset = (y * canvasAi2d.width + x) * 4
                const a = aiImageData.data[offset + 3]
                if (!a) {
                    continue
                }

                const r = aiImageData.data[offset]
                const g = aiImageData.data[offset + 1]
                const b = aiImageData.data[offset + 2]

                ctxTarget.font = `${gridSize[1]}px "JetBrains Mono", monospace`
                ctxTarget.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`
                const uid = Math.round(currentFrame / 15) * (y * canvasAi2d.width + x)
                const text = fnv1a32(uid) / 0x100000000 < 0.5 ? "0" : "1"

                const glitchX = (Math.random() - 0.5) * .3 * gridSize[0],
                    glitchY = (Math.random() - 0.5) * .3 * gridSize[1]

                ctxTarget.fillText(text, x * gridSize[0] + glitchX, y * gridSize[1] + glitchY)
            }
        }

        ctxHuman2d.drawImage(canvasHuman, 0, 0, canvasHuman2d.width, canvasHuman2d.height)
        const humanImageData = ctxHuman2d.getImageData(0, 0, canvasHuman2d.width, canvasHuman2d.height)
        for (let y = 0; y < canvasHuman2d.height; y++) {
            for (let x = 0; x < canvasHuman2d.width; x++) {
                const offset = (y * canvasHuman2d.width + x) * 4
                const a = humanImageData.data[offset + 3]
                if (!a) {
                    continue
                }

                const r = humanImageData.data[offset]
                const g = humanImageData.data[offset + 1]
                const b = humanImageData.data[offset + 2]

                ctxTarget.font = `${gridSize[1]}px "JetBrains Mono", monospace`
                ctxTarget.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`
                const uid = Math.round(currentFrame / 30) * (y * canvasAi2d.width + x)
                const text = humanTexts[Math.floor(fnv1a32(uid) / 0x100000000 * humanTexts.length)]

                const glitchX = (Math.random() - 0.5) * .5 * gridSize[0],
                    glitchY = (Math.random() - 0.5) * .5 * gridSize[1]

                ctxTarget.fillText(text, x * gridSize[0] + glitchX, y * gridSize[1] + glitchY)
            }
        }
    }

    render()

    return () => {
        if (handle) {
            cancelAnimationFrame(handle)
        }
        aiFingerFacadeResizeCleanUp()
        moveCleanUp()
    }
}


interface Transition3Props {
    gridSize: [number, number]
}

const Transition3: FC<Transition3Props> = ({ gridSize }) => {
    const canvasTarget = useRef<HTMLCanvasElement>(null)
    const canvasAiFacade = useRef<HTMLCanvasElement>(null)
    const canvasHumanFacade = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasAiFacade.current || !canvasTarget.current || !canvasHumanFacade.current) {
            return
        }

        console.log("ThreeCanvas Loaded")
        const onUnload = onCanvasLoad(
            canvasAiFacade.current,
            canvasTarget.current,
            canvasHumanFacade.current,
            gridSize
        )

        return () => {
            console.log("ThreeCanvas Unmounting...")
            onUnload()
        }
    }, [canvasAiFacade, canvasTarget, canvasHumanFacade]);

    return (
        <div>
            <div className={"w-screen h-screen relative"}>
                <canvas ref={canvasTarget} className={"w-full h-full absolute top-0"}/>
                <div className={"absolute top-0"}>
                    <canvas ref={canvasAiFacade}></canvas>
                    <canvas ref={canvasHumanFacade}></canvas>
                </div>
            </div>
        </div>
    )
}

export default Transition3