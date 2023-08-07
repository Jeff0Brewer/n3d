import { mat4, vec3 } from 'gl-matrix'
import LandmarkSpheres from '../vis/landmark-spheres'
import LandmarkLabels from '../vis/landmark-label'
import type { Landmark } from '../lib/data'

class Landmarks {
    spheres: LandmarkSpheres
    labels: LandmarkLabels

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        landmarks: Array<Landmark>
    ) {
        this.spheres = new LandmarkSpheres(gl, model, view, proj)
        this.labels = new LandmarkLabels(gl, model, view, proj, landmarks)
    }

    draw (gl: WebGLRenderingContext, view: mat4, landmarks: Array<Landmark>, eye: vec3): void {
        this.spheres.draw(gl, view, landmarks, eye)
        this.labels.draw(gl, view, landmarks)
    }
}

export default Landmarks
