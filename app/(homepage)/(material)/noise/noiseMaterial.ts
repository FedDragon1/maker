import * as THREE from "three";
import vertexShader from "@/app/(homepage)/(material)/noise/vertex.glsl"
import fragmentShader from "@/app/(homepage)/(material)/noise/fragment.glsl"

export class NoiseMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader,
            fragmentShader,
            uniforms: {
                iTime: {
                    value: 1
                }
            },
            transparent: true
        });
    }
}

export function getNoiseBackground(camera: THREE.PerspectiveCamera) {
    const material = new NoiseMaterial()
    const angle = THREE.MathUtils.degToRad(camera.fov / 2)
    // tan(angle) = y / z
    const height = 2 * Math.tan(angle) * camera.position.z
    const width = height * camera.aspect

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        material
    )

    mesh.onAfterRender = () => material.uniforms.iTime.value += 0.01

    return mesh
}