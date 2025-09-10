"use client"

import { FC } from "react";
import { Environment, NoisedEnvironment } from "@/utils/three/environment";
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import ProjectCaption from "@/app/(homepage)/ProjectCaption";
import { ModelLoader } from "@/utils/three/modelLoader";
import { RingPoint } from "@/app/(homepage)/(models)/ring";
import { Station } from "@/app/(homepage)/(models)/station";
import { Planet } from "@/app/(homepage)/(models)/planet";
import LazyThreeCanvas from "@/app/LazyThreeCanvas";

interface Props {
}

const StarAtlas: FC<Props> = () => {
    return (
        <section className="w-full h-[400vh]" id="staratlas">
            <div className="h-screen w-full z-10 sticky top-0">
                <ProjectCaption title="StarAtlas Mock" link="https://staratlas-eight.vercel.app/">
                    A web application replicating the StarAtlas official site, featuring Three.js with custom GLSL shaders and GSAP ScrollTrigger animations.
                </ProjectCaption>
                <LazyThreeCanvas load={load} init={init} constructor={NoisedEnvironment}
                             className="w-full h-full relative z-0"/>
            </div>
        </section>
    )
}

function init(environment: Environment) {
    environment.setBackground("#f0f0f0")
    environment.initialize()
}

async function load(environment: Environment) {
    const modelLoader = new ModelLoader()
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    environment.camera.position.x = 0;
    environment.camera.position.y = 0;
    environment.camera.position.z = 40;

    const planet = new Planet(modelLoader, environment);
    const station = new Station(modelLoader, environment);
    const ringAnimations = initRings(modelLoader, environment);

    const mainTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: "#staratlas",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    })

    mainTimeline.add(ringAnimations).addLabel("spaceScene")
    planet.setAnimation((particle) => {
        particle.position.x = -18;
        particle.position.y = 8;
        particle.position.z = -37;
        particle.scale.set(-1, 1, 1);

        const timeline = gsap.timeline()

        timeline
            .to(particle.position, { z: 20, y: 5 }, 0)
            .to(particle.position, { z: 40 })

        mainTimeline.add(timeline, "spaceScene-=0.2")
    })
    station.setAnimation((particle) => {
        particle.position.x = 0.35;
        particle.position.y = 0;
        particle.position.z = -70;
        particle.rotation.x = 0.5
        particle.scale.set(-1, 1, 1);

        const timeline = gsap.timeline()

        const delay = 0.03
        timeline
            .to(particle.position, { z: 50, y: -10 }, delay)
            .to(particle.rotation, { y: 0.5, x: 0 }, delay)

            .to(particle.material.uniforms.minOpacity, { value: 0.2, duration: 0.1 }, delay)
            .to(particle.material.uniforms.minOpacity, { value: 0, duration: 0.1 }, delay + 0.1)

            .to(particle.material.uniforms.maxOpacity, { value: 0.23, duration: 0.2 }, delay)

            .to(particle.material.uniforms.fadeDistance, { value: 7, duration: 0.05 }, delay + 0.15)
            .to(particle.material.uniforms.blur, { value: 8, duration: 0.05 }, delay + 0.15)

        mainTimeline.add(timeline, "spaceScene-=0.3")
    })
}

function initRings(modelLoader: ModelLoader, environment: Environment) {
    const ringLayout = [{ z: 0 }, { z: 6 }, { z: 11 }, { z: 15 }]
    const rings = ringLayout.map(({ z }) => {
        const ring = new RingPoint(modelLoader, environment)
        ring.particle!.position.z = z
        ring.particle!.material.uniforms.maxOpacity.value = 0
        return ring
    })
    const ringPositions = rings.map(ring => ring.particle!.position)
    const ringOpacities = rings.map(ring => ring.particle!.material.uniforms.maxOpacity)

    const timeline = gsap.timeline()

    timeline.to(
        ringPositions,
        {
            ease: "power3.inOut",
            duration: 0.2,
            z: (i) => ringLayout[i].z,
            stagger: {
                each: 0.002
            }
        },
        0.02
    ).to(
        ringOpacities.toReversed(),
        {
            ease: "power3.inOut",
            duration: 0.3,
            value: 0.6,
            stagger: {
                each: 0.002
            }
        },
        0
    ).to(
        ringPositions.toReversed(),
        {
            z: 40,
            ease: "power3.inOut",
            duration: 0.5,
            stagger: {
                each: 0.02
            }
        },
        0.03
    )

    return timeline
}

export default StarAtlas