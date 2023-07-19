import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getPositions, getSelectColors } from '../lib/data'
import type { GalaxyData, SelectMap } from '../lib/data'
import vertSource from '../shaders/vert.glsl?raw'
import fragSource from '../shaders/frag.glsl?raw'

const POS_FPV = 3
const SEL_FPV = 3

const POS_BYTE = Float32Array.BYTES_PER_ELEMENT
const SEL_BYTE = Uint8Array.BYTES_PER_ELEMENT

class Points {
    program: WebGLProgram
    posBuffer: WebGLBuffer
    bindPosition: () => void
    selBuffer: WebGLBuffer
    bindSelect: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setDevicePixelRatio: (ratio: number) => void
    selectMap: SelectMap
    numVertex: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        data: GalaxyData
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        const positions = getPositions(data)
        this.posBuffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
        this.numVertex = positions.length / POS_FPV

        const { map, buffer } = getSelectColors(data)
        this.selBuffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW)
        this.selectMap = map

        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0, POS_BYTE)
        this.bindSelect = initAttribute(gl, this.program, 'selectColor', SEL_FPV, SEL_FPV, 0, SEL_BYTE)

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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer)
        this.bindPosition()

        gl.bindBuffer(gl.ARRAY_BUFFER, this.selBuffer)
        this.bindSelect()

        this.setModelMatrix(modelMatrix)
        this.setViewMatrix(viewMatrix)

        gl.drawArrays(gl.POINTS, 0, this.numVertex)
    }
}

export default Points
