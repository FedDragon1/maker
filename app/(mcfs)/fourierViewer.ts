"use client"

import * as THREE from 'three'
import { Environment } from "@/utils/three/environment";

export function createTimedPoint(t: number, position: [number, number, number], material: THREE.Material) {
    const geometry = new THREE.BufferGeometry()
    const vertex = new Float32Array(position)
    geometry.setAttribute('position', new THREE.BufferAttribute(vertex, 3))

    // alpha = 0
    const time = new Float32Array([0])
    geometry.setAttribute("time", new THREE.BufferAttribute(time, 1))

    const createdAt = new Int32Array([t])
    geometry.setAttribute("createdAt", new THREE.BufferAttribute(createdAt, 1))

    return new THREE.Points(geometry, material)
}

export function mergeTimedPoints(points: THREE.Points[], material: THREE.Material) {
    const mergedPositions = points.flatMap(point => {
        const geometry = point.geometry
        const positions = geometry.attributes.position.array
        return Array.from(positions)
    })

    const mergedGeometry = new THREE.BufferGeometry()
    const positions = new THREE.Float32BufferAttribute(mergedPositions, 3)
    mergedGeometry.setAttribute("position", positions)

    const mergedTime = points.flatMap((p) => Array.from(p.geometry.getAttribute("time").array))
    mergedGeometry.setAttribute("time", new THREE.BufferAttribute(new Float32Array(mergedTime), 1))

    const mergedCreatedAt = points.flatMap((p) => Array.from(p.geometry.getAttribute("createdAt").array))
    mergedGeometry.setAttribute("createdAt", new THREE.BufferAttribute(new Float32Array(mergedCreatedAt), 1))

    return new THREE.Points(mergedGeometry, material)
}

export function filterTimedPoints(points: THREE.Points, t: number, ttl: number, material: THREE.Material) {
    const position = Array.from(points.geometry.getAttribute("position").array)
    const createdAt = Array.from(points.geometry.getAttribute("createdAt").array)

    const survivingIndices: number[] = createdAt
        .map((time, i) => t - time < ttl ? i : null)
        .filter(i => i !== null)

    const survivingPositions = []
    const survivingCreatedAt = []

    for (const index of survivingIndices) {
        survivingCreatedAt.push(createdAt[index])
        survivingPositions.push(position[index * 3], position[index * 3 + 1], position[index * 3 + 2])
    }

    const filteredGeometry = new THREE.BufferGeometry()
    const positions = new THREE.Float32BufferAttribute(survivingPositions, 3)
    const created = new THREE.Int32BufferAttribute(survivingCreatedAt, 1)

    filteredGeometry.setAttribute("position", positions)
    filteredGeometry.setAttribute("createdAt", created)

    return new THREE.Points(filteredGeometry, material)
}

export class PointRegistry {
    // createdAt (t), point object
    points: THREE.Points | null
    material: THREE.Material
    // tll unit -> frames
    ttl: number
    t: number

    constructor(material: THREE.Material, ttl: number = 500) {
        this.points = null
        this.ttl = ttl
        this.material = material
        this.t = 0
    }

    createPoint(position: [number, number, number]) {
        const point = createTimedPoint(this.t, position, this.material)
        if (this.points === null) {
            this.points = point
        } else {
            this.points = mergeTimedPoints([this.points, point], this.material)
        }
        return point
    }

    update(environment: Environment) {
        if (!this.points) {
            return
        }

        for (const obj of environment.scene.children) {
            if (obj.constructor === THREE.Points) {
                environment.removeObjects(obj)
            }
        }

        this.points = filterTimedPoints(this.points, this.t, this.ttl, this.material)

        const createdAt = Array.from(this.points.geometry.getAttribute("createdAt").array);
        const alphas = createdAt.map((created) => (this.t - created) / this.ttl)
        this.points.geometry.setAttribute("time", new THREE.Float32BufferAttribute(alphas, 1))

        // console.log(this.points)
        environment.addObjects(this.points)

        this.t++
    }
}