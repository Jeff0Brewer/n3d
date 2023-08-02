import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getIcosphere, icosphereToVerts } from '../lib/icosphere'
import type { Landmark } from '../lib/data'
import vertSource from '../shaders/landmark-sphere-vert.glsl?raw'
import fragSource from '../shaders/landmark-sphere-frag.glsl?raw'

const POS_FPV = 3
const NRM_FPV = 3

class LandmarkSpheres {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    numVertex: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        data: Array<Landmark>
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        // create static buffer from all landmark position / radius
        // since landmarks never change
        const ico = getIcosphere(3)
        const icoVerts = icosphereToVerts(ico)
        this.numVertex = data.length * icoVerts.length / POS_FPV
        const verts = new Float32Array(this.numVertex * (POS_FPV + NRM_FPV))
        let ind = 0
        for (const { radius, position } of data) {
            for (let i = 0; i < icoVerts.length; i += 3) {
                // copy resized / repositioned icosphere vertices
                // for each landmark radius / position
                verts[ind++] = icoVerts[i] * radius + position[0]
                verts[ind++] = icoVerts[i + 1] * radius + position[1]
                verts[ind++] = icoVerts[i + 2] * radius + position[2]
                // use already normalized icosphere vertices for vertex normals
                verts[ind++] = icoVerts[i]
                verts[ind++] = icoVerts[i + 1]
                verts[ind++] = icoVerts[i + 2]
            }
        }
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)

        // init attribs from swizzled buffer
        const stride = POS_FPV + NRM_FPV
        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, stride, 0, gl.FLOAT)
        const bindNormal = initAttribute(gl, this.program, 'normal', NRM_FPV, stride, POS_FPV, gl.FLOAT)
        this.bindAttrib = (): void => {
            bindPosition()
            bindNormal()
        }

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')

        // init uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
    }

    draw (gl: WebGLRenderingContext, view: mat4): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindAttrib()
        this.setViewMatrix(view)

        // cull face to prevent depth issues due to triangle order
        gl.enable(gl.CULL_FACE)
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertex)
        gl.disable(gl.CULL_FACE)
    }
}

export default LandmarkSpheres
