import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getPositions, getSelectColors } from '../lib/data'
import { COLOR_MAP_COLORS } from '../components/color-map'
import type { GalaxyData, SelectMap } from '../lib/data'
import type { ColorField } from '../components/color-map'
import Camera from '../lib/camera'
import ColorMap from '../lib/color-map'
import vertSource from '../shaders/point-vert.glsl?raw'
import fragSource from '../shaders/point-frag.glsl?raw'

const POS_FPV = 3
const SEL_FPV = 3
const COL_FPV = 3
const VIS_FPV = 1

class Points {
    program: WebGLProgram

    posBuffer: WebGLBuffer
    bindPosition: () => void
    selBuffer: WebGLBuffer
    bindSelect: () => void
    colBuffer: WebGLBuffer
    bindColor: () => void
    visBuffer: WebGLBuffer
    bindVisibility: () => void

    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setInvMatrix: (mat: mat4) => void
    setDevicePixelRatio: (ratio: number) => void
    setSelecting: (selecting: boolean) => void
    setMousePos: (x: number, y: number) => void

    numVertex: number
    positions: Float32Array
    selectMap: SelectMap
    colorMap: ColorMap

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

        const colors = new Uint8Array(this.numVertex * COL_FPV)
        colors.fill(255)
        this.colBuffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
        this.bindColor = initAttribute(gl, this.program, 'color', COL_FPV, COL_FPV, 0, gl.UNSIGNED_BYTE)

        const visiblity = new Uint8Array(this.numVertex * VIS_FPV)
        visiblity.fill(1)
        this.visBuffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, visiblity, gl.STATIC_DRAW)
        this.bindVisibility = initAttribute(gl, this.program, 'visibility', VIS_FPV, VIS_FPV, 0, gl.UNSIGNED_BYTE)

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uInvMatrix = gl.getUniformLocation(this.program, 'invMatrix')
        const uDevicePixelRatio = gl.getUniformLocation(this.program, 'devicePixelRatio')
        const uMousePos = gl.getUniformLocation(this.program, 'mousePos')
        const uSelecting = gl.getUniformLocation(this.program, 'selecting')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uInvMatrix, false, inv)
        gl.uniform1f(uDevicePixelRatio, window.devicePixelRatio)
        gl.uniform1i(uSelecting, 0)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setInvMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uInvMatrix, false, mat) }
        this.setDevicePixelRatio = (ratio: number): void => { gl.uniform1f(uDevicePixelRatio, ratio) }
        this.setSelecting = (selecting: boolean): void => {
            gl.useProgram(this.program)
            gl.uniform1i(uSelecting, selecting ? 1 : 0)
        }
        this.setMousePos = (x: number, y: number): void => {
            gl.useProgram(this.program)
            gl.uniform2f(uMousePos, x, y)
        }

        this.colorMap = new ColorMap(COLOR_MAP_COLORS)
    }

    setupHandlers (canvas: HTMLCanvasElement): (() => void) {
        const mouseMove = (e: MouseEvent): void => {
            const x = e.clientX / window.innerWidth * 2 - 1
            const y = -(e.clientY / window.innerHeight * 2 - 1)
            this.setMousePos(x, y)
        }
        canvas.addEventListener('mousemove', mouseMove)
        return (): void => {
            canvas.removeEventListener('mousemove', mouseMove)
        }
    }

    setupSelectHandlers (
        gl: WebGLRenderingContext,
        canvas: HTMLCanvasElement,
        camera: Camera,
        setSelected: (ind: number) => void
    ): (() => void) {
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
                    setSelected(ind)
                }
            })
        }
        canvas.addEventListener('mousedown', mouseDown)
        return (): void => {
            canvas.removeEventListener('mousedown', mouseDown)
        }
    }

    colorMapField (gl: WebGLRenderingContext, data: GalaxyData, field: ColorField): void {
        const { headers, entries } = data
        const fieldInd = headers[field.name]

        const colors = new Uint8Array(entries.length * COL_FPV)
        let colInd = 0
        for (const entry of entries) {
            const value = parseFloat(entry[fieldInd])
            if (Number.isNaN(value)) {
                colors[colInd++] = 80
                colors[colInd++] = 80
                colors[colInd++] = 80
                continue
            }
            const per = (value - field.currMin) / (field.currMax - field.currMin)
            const color = this.colorMap.map(per)
            colors[colInd++] = color[0] * 255
            colors[colInd++] = color[1] * 255
            colors[colInd++] = color[2] * 255
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
    }

    filterSelections (
        gl: WebGLRenderingContext,
        selections: Array<Array<number>>
    ): void {
        const visibility = new Uint8Array(this.numVertex * VIS_FPV)
        visibility.fill(1)

        const allSelections = selections.flat()
        for (const ind of allSelections) {
            visibility[ind] = 0
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.visBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, visibility, gl.STATIC_DRAW)
    }

    draw (gl: WebGLRenderingContext, view: mat4, inv: mat4): void {
        gl.useProgram(this.program)

        this.setViewMatrix(view)
        this.setInvMatrix(inv)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer)
        this.bindPosition()

        gl.bindBuffer(gl.ARRAY_BUFFER, this.selBuffer)
        this.bindSelect()

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colBuffer)
        this.bindColor()

        gl.drawArrays(gl.POINTS, 0, this.numVertex)
    }
}

export default Points
