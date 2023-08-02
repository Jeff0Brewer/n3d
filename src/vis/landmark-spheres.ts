import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getIcosphere, icosphereToVerts } from '../lib/icosphere'
import type { Landmark } from '../lib/data'
import vertSource from '../shaders/landmark-sphere-vert.glsl?raw'
import fragSource from '../shaders/landmark-sphere-frag.glsl?raw'

const POS_FPV = 3

class LandmarkSpheres {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setCenter: (center: vec3) => void
    setRadius: (radius: number) => void
    numVertex: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        // single icosphere in buffer since drawing landmarks individually
        const ico = getIcosphere(3)
        const verts = icosphereToVerts(ico)
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / POS_FPV

        // init position attrib, don't need normal since sphere vertices are already normalized
        this.bindAttrib = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0, gl.FLOAT)

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uCenter = gl.getUniformLocation(this.program, 'center')
        const uRadius = gl.getUniformLocation(this.program, 'radius')

        // init mvp uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)

        // get closures to easily set uniforms
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setCenter = (center: vec3): void => { gl.uniform3fv(uCenter, center) }
        this.setRadius = (radius: number): void => { gl.uniform1f(uRadius, radius) }
    }

    draw (gl: WebGLRenderingContext, view: mat4, landmarks: Array<Landmark>, eye: vec3): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindAttrib()
        this.setViewMatrix(view)

        // sort landmarks by distance from camera for correct
        // depth when blending
        const compareDist = (a: Landmark, b: Landmark): number => {
            const aDist = vec3.len(vec3.sub(vec3.create(), a.position, eye))
            const bDist = vec3.len(vec3.sub(vec3.create(), b.position, eye))
            return bDist - aDist
        }
        // copy landmarks arr to prevent mutation in sort
        const sorted = [...landmarks]
        sorted.sort(compareDist)

        // cull face to prevent depth issues due to triangle order
        gl.enable(gl.CULL_FACE)
        for (const landmark of sorted) {
            this.setCenter(landmark.position)
            this.setRadius(landmark.radius)
            gl.drawArrays(gl.TRIANGLES, 0, this.numVertex)
        }
        gl.disable(gl.CULL_FACE)
    }
}

export default LandmarkSpheres
