import * as THREE from "three"
import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"

type UniformVariables = {
    near: number
    far: number
    blur: number
    minOpacity: number
    maxOpacity: number,
    referenceParticleSize: number
}

const defaultUniformVariables: UniformVariables = {
    near: 10,
    far: 0,
    blur: 5,
    minOpacity: 0,
    maxOpacity: 1,
    referenceParticleSize: 10
}

function recordToUniformVariables(uniformVariables?: Record<string, any>) {
    if (!uniformVariables) {
        return {}
    }

    const transformed: Record<string, THREE.IUniform> = {}
    Object.entries(uniformVariables).forEach(([key, value]) => transformed[key] = { value })
    return transformed
}

export class McfsMaterial extends THREE.ShaderMaterial {
    constructor(pixelRatio: number, uniformVariables?: UniformVariables) {
        const mergedUniformVariables = {
            pixelRatio: {
                value: pixelRatio
            },
            ...recordToUniformVariables({ ...defaultUniformVariables, ...uniformVariables })
        }

        super({
            vertexShader,
            fragmentShader,
            uniforms: mergedUniformVariables,
            transparent: true
        });
    }
}