import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import CameraPath from '../lib/camera-path'
import vertSource from '../shaders/camera-trace-vert.glsl?raw'
import fragSource from '../shaders/camera-trace-frag.glsl?raw'

const POS_FPV = 3

class CameraTrace {
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
        proj: mat4
    ) {
        this.program = initProgram(gl, vertSource, fragSource)
        this.buffer = initBuffer(gl)
        this.bindAttrib = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0, gl.FLOAT)
        this.numVertex = 0

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
    }

    setPath (gl: WebGLRenderingContext, path: CameraPath | null): void {
        const verts = path !== null
            ? path.getPathTrace()
            : new Float32Array(0)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / POS_FPV
    }

    draw (gl: WebGLRenderingContext, view: mat4): void {
        if (this.numVertex > 0) {
            gl.useProgram(this.program)
            this.setViewMatrix(view)
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
            this.bindAttrib()
            gl.drawArrays(gl.LINE_STRIP, 0, this.numVertex)
        }
    }
}

export default CameraTrace
