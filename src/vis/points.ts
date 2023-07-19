import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getPositions, getSelectColors } from '../lib/data'
import type { GalaxyData, SelectMap } from '../lib/data'
import Camera from '../lib/camera'
import vertSource from '../shaders/vert.glsl?raw'
import fragSource from '../shaders/frag.glsl?raw'

const POS_FPV = 3
const SEL_FPV = 3

class Points {
    program: WebGLProgram
    posBuffer: WebGLBuffer
    bindPosition: () => void
    selBuffer: WebGLBuffer
    bindSelect: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setInvMatrix: (mat: mat4) => void
    setDevicePixelRatio: (ratio: number) => void
    setMousePos: (x: number, y: number) => void
    numVertex: number
    positions: Float32Array
    selectMap: SelectMap

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        inv: mat4,
        data: GalaxyData
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        this.positions = getPositions(data)
        this.posBuffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW)
        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0, gl.FLOAT)
        this.numVertex = this.positions.length / POS_FPV

        const { map, buffer } = getSelectColors(data)
        this.selBuffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW)
        this.bindSelect = initAttribute(gl, this.program, 'selectColor', SEL_FPV, SEL_FPV, 0, gl.UNSIGNED_BYTE)
        this.selectMap = map

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uInvMatrix = gl.getUniformLocation(this.program, 'invMatrix')
        const uDevicePixelRatio = gl.getUniformLocation(this.program, 'devicePixelRatio')
        const uMousePos = gl.getUniformLocation(this.program, 'mousePos')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uInvMatrix, false, inv)
        gl.uniform1f(uDevicePixelRatio, window.devicePixelRatio)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setInvMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uInvMatrix, false, mat) }
        this.setDevicePixelRatio = (ratio: number): void => { gl.uniform1f(uDevicePixelRatio, ratio) }
        this.setMousePos = (x: number, y: number): void => {
            gl.uniform2f(uMousePos, x, y)
        }
    }

    setupHandlers (
        gl: WebGLRenderingContext,
        data: GalaxyData,
        canvas: HTMLCanvasElement,
        camera: Camera
    ): (() => void) {
        const mouseMove = (e: MouseEvent): void => {
            const x = e.clientX / window.innerWidth * 2 - 1
            const y = -(e.clientY / window.innerHeight * 2 - 1)
            this.setMousePos(x, y)
        }
        const mouseDown = (e: MouseEvent): void => {
            // wrap in request frame to wait for current render to finish before getting pixel data
            window.requestAnimationFrame(() => {
                const x = e.clientX * window.devicePixelRatio
                const y = (window.innerHeight - e.clientY) * window.devicePixelRatio
                const pixel = new Uint8Array(4)
                gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
                const hex = pixel[0].toString(16) + pixel[1].toString(16) + pixel[2].toString(16)
                const ind = this.selectMap[hex]
                if (ind) {
                    camera.setFocus(this.positions.slice(ind * POS_FPV, ind * POS_FPV + POS_FPV))
                    console.log(data.entries[ind])
                }
            })
        }
        canvas.addEventListener('mousemove', mouseMove)
        canvas.addEventListener('mousedown', mouseDown)
        return (): void => {
            canvas.removeEventListener('mousemove', mouseMove)
            canvas.removeEventListener('mousedown', mouseDown)
        }
    }

    draw (gl: WebGLRenderingContext, model: mat4, view: mat4, inv: mat4): void {
        gl.useProgram(this.program)

        this.setModelMatrix(model)
        this.setViewMatrix(view)
        this.setInvMatrix(inv)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer)
        this.bindPosition()

        gl.bindBuffer(gl.ARRAY_BUFFER, this.selBuffer)
        this.bindSelect()

        gl.drawArrays(gl.POINTS, 0, this.numVertex)
    }
}

export default Points
