import { mat4, vec3 } from 'gl-matrix'
import LandmarkSpheres from '../vis/landmark-spheres'
import type { Landmark } from '../lib/data'

class Landmarks {
    spheres: LandmarkSpheres

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4
    ) {
        this.spheres = new LandmarkSpheres(gl, model, view, proj)
    }

    draw (gl: WebGLRenderingContext, view: mat4, landmarks: Array<Landmark>, eye: vec3): void {
        this.spheres.draw(gl, view, landmarks, eye)
    }
}

export default Landmarks
