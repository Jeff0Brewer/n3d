import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import vertSource from '../shaders/camera-axis-vert.glsl?raw'
import fragSource from '../shaders/camera-axis-frag.glsl?raw'

const S = 0.5 // axis size
const B = 0.5 // axis color brightness
const AXIS_VERTS = new Float32Array([
    0, 0, 0, 1, B, B, // origin, red
    S, 0, 0, 1, B, B, // positive x, red
    0, 0, 0, B, 1, B, // origin, green
    0, S, 0, B, 1, B, // positive y, green
    0, 0, 0, B, B, 1, // origin, blue
    0, 0, S, B, B, 1 // positive z, blue
])

const POS_FPV = 3
const COL_FPV = 3

class CameraAxis {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    numVertex: number
    drawing: boolean

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        const stride = POS_FPV + COL_FPV

        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, AXIS_VERTS, gl.STATIC_DRAW)
        this.numVertex = AXIS_VERTS.length / stride

        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, stride, 0, gl.FLOAT)
        const bindColor = initAttribute(gl, this.program, 'color', COL_FPV, stride, POS_FPV, gl.FLOAT)
        this.bindAttrib = (): void => {
            bindPosition()
            bindColor()
        }

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }

        this.drawing = false
    }

    setPosition (gl: WebGLRenderingContext, position: [number, number, number] | null): void {
        if (position === null) {
            this.drawing = false
        } else {
            const translation = mat4.fromTranslation(mat4.create(), position)
            gl.useProgram(this.program)
            this.setModelMatrix(translation)
            this.drawing = true
        }
    }

    draw (gl: WebGLRenderingContext, view: mat4): void {
        if (this.drawing) {
            gl.disable(gl.DEPTH_TEST)

            gl.useProgram(this.program)
            this.setViewMatrix(view)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
            this.bindAttrib()
            gl.drawArrays(gl.LINES, 0, this.numVertex)

            gl.enable(gl.DEPTH_TEST)
        }
    }
}

export default CameraAxis
