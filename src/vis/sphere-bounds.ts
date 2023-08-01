import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getIcosphere } from '../lib/icosphere'
import type { Icosphere } from '../lib/icosphere'
import vertSource from '../shaders/sphere-vert.glsl?raw'
import fragSource from '../shaders/sphere-frag.glsl?raw'

type Sphere = {
    center: vec3,
    radius: number
}

const POS_FPV = 3

const icosphereToVerts = (ico: Icosphere): Float32Array => {
    const verts = new Float32Array(ico.triangles.length * 3 * POS_FPV)
    let ind = 0
    for (let ti = 0; ti < ico.triangles.length; ti++) {
        for (let vi = 0; vi < 3; vi++) {
            const [x, y, z] = ico.vertices[ico.triangles[ti][vi]]
            verts[ind++] = x
            verts[ind++] = y
            verts[ind++] = z
        }
    }
    return verts
}

class SphereBounds {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setCenter: (center: vec3) => void
    setRadius: (rad: number) => void
    numVertex: number
    drawing: boolean

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4
    ) {
        // compile shader program
        this.program = initProgram(gl, vertSource, fragSource)

        // init buffer with sphere verts
        const ico = getIcosphere(3)
        const verts = icosphereToVerts(ico)
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / POS_FPV

        // init position attribute
        this.bindAttrib = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0, gl.FLOAT)

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uCenter = gl.getUniformLocation(this.program, 'center')
        const uRadius = gl.getUniformLocation(this.program, 'radius')

        // init uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)

        // get closures to easily set uniforms
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setCenter = (center: vec3): void => { gl.uniform3fv(uCenter, center) }
        this.setRadius = (rad: number): void => { gl.uniform1f(uRadius, rad) }

        this.drawing = false
    }

    updateSphere (gl: WebGLRenderingContext, sphere: Sphere | null): void {
        if (!sphere) {
            this.drawing = false
        } else {
            this.drawing = true
            gl.useProgram(this.program)
            this.setCenter(sphere.center)
            this.setRadius(sphere.radius)
        }
    }

    draw (gl: WebGLRenderingContext, view: mat4): void {
        if (this.drawing) {
            gl.useProgram(this.program)
            this.setViewMatrix(view)
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
            this.bindAttrib()
            gl.depthMask(false)
            gl.drawArrays(gl.TRIANGLES, 0, this.numVertex)
            gl.depthMask(true)
        }
    }
}

export default SphereBounds
export type { Sphere }
