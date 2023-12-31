import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import CameraPath from '../lib/camera-path'
import vertSource from '../shaders/camera-trace-vert.glsl?raw'
import fragSource from '../shaders/camera-trace-frag.glsl?raw'

const POS_FPV = 3

class CameraTrace {
    program: WebGLProgram
    pathBuffer: WebGLBuffer
    cameraBuffer: WebGLBuffer
    focusBuffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    numPathVertex: number
    numCameraVerts: number
    numFocusVerts: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4
    ) {
        this.program = initProgram(gl, vertSource, fragSource)
        this.pathBuffer = initBuffer(gl)
        this.cameraBuffer = initBuffer(gl)
        this.focusBuffer = initBuffer(gl)
        this.bindAttrib = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0, gl.FLOAT)
        this.numPathVertex = 0
        this.numCameraVerts = 0
        this.numFocusVerts = 0

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
        const pathVerts = path !== null
            ? path.getPathTrace()
            : new Float32Array(0)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pathBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, pathVerts, gl.STATIC_DRAW)
        this.numPathVertex = pathVerts.length / POS_FPV

        const cameraVerts = path !== null
            ? path.getCameraPoints()
            : new Float32Array(0)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cameraBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, cameraVerts, gl.STATIC_DRAW)
        this.numCameraVerts = cameraVerts.length / POS_FPV

        const focusVerts = path !== null
            ? path.getFocusLines()
            : new Float32Array(0)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.focusBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, focusVerts, gl.STATIC_DRAW)
        this.numFocusVerts = focusVerts.length / POS_FPV
    }

    draw (gl: WebGLRenderingContext, view: mat4): void {
        if (this.numCameraVerts > 0) {
            gl.disable(gl.DEPTH_TEST)

            gl.useProgram(this.program)
            this.setViewMatrix(view)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.pathBuffer)
            this.bindAttrib()
            gl.drawArrays(gl.LINE_STRIP, 0, this.numPathVertex)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.focusBuffer)
            this.bindAttrib()
            gl.drawArrays(gl.LINES, 0, this.numFocusVerts)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.cameraBuffer)
            this.bindAttrib()
            gl.drawArrays(gl.POINTS, 0, this.numCameraVerts)

            gl.enable(gl.DEPTH_TEST)
        }
    }
}

export default CameraTrace
