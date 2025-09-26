import { FC, useCallback, useEffect, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { registerCanvasResizeListener, registerMouseMoveListener } from "@/lib/threeHelper";
import { EffectComposer, RenderPass } from "postprocessing";

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Flower } from "@/lib/flower";
import { AxesHelper } from "three";

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
    constructor() {
        super()

        loadModel().then((object) => {
            object.geometry.scale(0.1, 0.1, 0.1)
            this.add(object)
        })
    }
}

function onCanvasLoad(canvas: HTMLCanvasElement) {
    const aspRatio = canvas.clientWidth / canvas.clientHeight
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, aspRatio, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false
    })
    camera.position.set(0, 0, 4);

    const pointLight1 = new THREE.PointLight(0xff77ff, 10)
    pointLight1.position.set(-2, 2, 2)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x77ffff, 20)
    pointLight2.position.set(-2, 2, -2)
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0xffff77, 20)
    pointLight3.position.set(0, -4, 0)
    scene.add(pointLight3)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
    scene.add(ambientLight)

    const aiFinger = new Finger()
    const humanFinger = new Finger()

    const axesHelper = new AxesHelper();

    scene.add(aiFinger)
    scene.add(axesHelper)

    const composer = new EffectComposer(renderer, {
        frameBufferType: THREE.FloatType
    })
    composer.addPass(new RenderPass(scene, camera))

    const resizeCleanUp = registerCanvasResizeListener({canvas, renderer, camera, composer})
    const moveCleanUp = registerMouseMoveListener(canvas, (u, v) => {

    })

    const controls = new OrbitControls( camera, renderer.domElement );

    let handle: number;
    function render() {
        handle = requestAnimationFrame(render)
        controls.update()
        composer.render()
    }
    render()

    return () => {
        if (handle) {
            cancelAnimationFrame(handle)
        }
        resizeCleanUp()
        moveCleanUp()
    }
}


const Transition3: FC = () => {
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

    return (
        <div>
            <canvas ref={canvasCallback} className={"w-screen h-screen"}></canvas>
        </div>
    )
}

export default Transition3