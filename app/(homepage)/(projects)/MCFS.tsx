"use client"

import * as THREE from 'three'
import React, { FC, useEffect, useRef, useState } from "react";
import { AnimatedEnvironment, Environment } from "@/utils/three/environment";
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import RefSvg from "@/app/(mcfs)/RefSvg";
import { addComplex, analyzeCurve, expComplex, fourierCoefficients, multiplyComplex } from "@/app/(mcfs)/mcfs";
import { ModelLoader } from "@/utils/three/modelLoader";
import { McfsMaterial } from "@/app/(mcfs)/(material)/mcfsMaterial";
import { PointRegistry } from "@/app/(mcfs)/fourierViewer";
import LazyThreeCanvas from "@/app/(components)/LazyThreeCanvas";

interface Props {
}

const MCFS: FC<Props> = () => {
    const svg = useRef<SVGSVGElement>(null)
    const canvas = useRef<HTMLCanvasElement>(null)

    const [coefficient, setCoefficient] = useState<{
        [key: number]: [number, number]
    }>([]);


    useEffect(() => {
        if (!canvas.current) {
            return
        }
        const { width, height } = canvas.current.getBoundingClientRect()
        const dpr = window.devicePixelRatio

        canvas.current.width = width * dpr
        canvas.current.height = height * dpr
    }, [canvas]);

    useEffect(() => {
        if (!svg.current) {
            return;
        }
        setCoefficient(fourierCoefficients(
            analyzeCurve(svg.current, 0.2),
            250
        ))
    }, [svg]);

    async function load(environment: Environment) {
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: "#mcfs",
                start: "top top",
                end: "bottom bottom",
                scrub: 1
            }
        })

        timeline.to(environment.scene.rotation, {
            x: -Math.PI / 2 * 0.8,
            duration: 1
        }, 0.1).to(environment.camera, {
            zoom : 5,
            duration: 0.5,
            onUpdate: () => environment.camera.updateProjectionMatrix()
        }, 0.5)

        const modelLoader = new ModelLoader()
        const armorStand = await modelLoader.loadGltf("/models/armor_stand.glb")
        armorStand.scene.scale.set(0.5, 0.5, 0.5)
        armorStand.scene.rotation.set(Math.PI / 2, 0, 0)

        // await for fourier analysis
        while (!Object.keys(coefficient).length) {
            await new Promise((resolve) => setTimeout(resolve, 500))
        }

        const armorStands: THREE.Object3D[] = []
        for (let i = 0; i < Object.keys(coefficient).length; i++) {
            armorStands.push(armorStand.scene.clone())
        }

        const light = new THREE.AmbientLight(0xffffff, 2); // Ambient light
        environment.scene.add(light);

        const size = 160; // The size of the grid
        const divisions = 80; // Number of divisions
        const gridHelper = new THREE.GridHelper(size, divisions,
            new THREE.Color(111 / 255, 82 / 255, 1), new THREE.Color(0.4, 0.4, 0.4));
        gridHelper.rotateX(Math.PI / 2)
        environment.addObjects(gridHelper);

        environment.scene.fog = new THREE.Fog(0xf0f0f0, 50, 100);

        const material = new McfsMaterial(window.devicePixelRatio)
        const pointRegistry = new PointRegistry(material, 980)

        function draw() {
            if (!coefficient) {
                return
            }

            let firstTime = true
            let origin: [number, number] = [0, 0]
            let i = 0;
            for (const [freqS, coef] of Object.entries(coefficient)) {
                const freq = Number(freqS)
                const offset = multiplyComplex(expComplex(0, 2 * freq * pointRegistry.t * Math.PI / 1000), coef)
                const post = armorStands[i]
                post.position.set(origin[0], -origin[1] + 15, 0)
                if (firstTime) {
                    const scale = Math.max(Math.abs(freq), 1);
                    post.scale.set(1 / scale, 1 / scale, 1 / scale)
                }
                const angle = Math.atan2(offset[1], offset[0])
                post.rotation.set(post.rotation.x, angle, post.rotation.z)
                origin = addComplex(origin, offset);
                i++;
            }

            // origin now holds the final location
            const x = origin[0]
            const y = origin[1]

            pointRegistry.update(environment)
            pointRegistry.createPoint([x, -y + 15, 0])
        }

        (environment as AnimatedEnvironment).setAnimation(draw)
        environment.addObjects(...armorStands)
    }

    return (
        <section className="w-full h-[400vh]" id="mcfs">
            <div className="h-screen w-full z-10 sticky top-0 overflow-hidden">
                <div className="w-[70%] h-full absolute z-0 right-0">
                    <div className="w-[10%] h-full absolute left-0 bg-gradient-to-r from-[#f0f0f0] to-transparent z-10"></div>
                    <RefSvg ref={svg}>
                        <path
                            d="m0 0c-5.427-0.1409-11.774 12.818-11.563 24.375 0.049 3.52 1.16 10.659 2.781 19.625-10.223 10.581-22.094 21.44-22.094 35.688-0.163 13.057 7.817 29.692 26.75 29.532 2.906-0.02 5.521-0.38 7.844-1 1.731 9.49 2.882 16.98 2.875 20.44 0.061 13.64-17.86 14.99-18.719 7.15 3.777-0.13 6.782-3.13 6.782-6.84 0-3.79-3.138-6.88-7.032-6.88-2.141 0-4.049 0.94-5.343 2.41-0.03 0.03-0.065 0.06-0.094 0.09-0.292 0.31-0.538 0.68-0.781 1.1-0.798 1.35-1.316 3.29-1.344 6.06 0 11.42 28.875 18.77 28.875-3.75 0.045-3.03-1.258-10.72-3.156-20.41 20.603-7.45 15.427-38.04-3.531-38.184-1.47 0.015-2.887 0.186-4.25 0.532-1.08-5.197-2.122-10.241-3.032-14.876 7.199-7.071 13.485-16.224 13.344-33.093 0.022-12.114-4.014-21.828-8.312-21.969zm1.281 11.719c2.456-0.237 4.406 2.043 4.406 7.062 0.199 8.62-5.84 16.148-13.031 23.719-0.688-4.147-1.139-7.507-1.188-9.5 0.204-13.466 5.719-20.886 9.813-21.281zm-7.719 44.687c0.877 4.515 1.824 9.272 2.781 14.063-12.548 4.464-18.57 21.954-0.781 29.781-10.843-9.231-5.506-20.158 2.312-22.062 1.966 9.816 3.886 19.502 5.438 27.872-2.107 0.74-4.566 1.17-7.438 1.19-7.181 0-21.531-4.57-21.531-21.875 0-14.494 10.047-20.384 19.219-28.969zm6.094 21.469c0.313-0.019 0.652-0.011 0.968 0 13.063 0 17.99 20.745 4.688 27.375-1.655-8.32-3.662-17.86-5.656-27.375z"/>
                    </RefSvg>
                    <LazyThreeCanvas load={load} init={init} className="w-full h-full absolute z-0 right-0" constructor={AnimatedEnvironment}></LazyThreeCanvas>
                </div>
            </div>
        </section>
    )
}

function init(environment: Environment) {
    environment.setBackground("#f0f0f0")
    environment.initialize();
}

export default MCFS