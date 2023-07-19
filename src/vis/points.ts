import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getPositions } from '../lib/data-load'
import type { CsvData } from '../lib/data-load'
import vertSource from '../shaders/vert.glsl?raw'
import fragSource from '../shaders/frag.glsl?raw'

const POS_FPV = 3

class Points {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setDevicePixelRatio: (ratio: number) => void
    numVertex: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        data: CsvData
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        const positions = getPositions(data)
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
        this.numVertex = positions.length / POS_FPV

        this.bindAttrib = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0)

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uDevicePixelRatio = gl.getUniformLocation(this.program, 'devicePixelRatio')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniform1f(uDevicePixelRatio, window.devicePixelRatio)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setDevicePixelRatio = (ratio: number): void => { gl.uniform1f(uDevicePixelRatio, ratio) }
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4, viewMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindAttrib()
        this.setModelMatrix(modelMatrix)
        this.setViewMatrix(viewMatrix)
        gl.drawArrays(gl.POINTS, 0, this.numVertex)
    }
}

export default Points
