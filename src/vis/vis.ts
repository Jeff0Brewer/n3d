import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import { getInvMatrix } from '../lib/unproject'
import type { FilterOptions } from '../components/filter'
import type { GalaxyData } from '../lib/data'
import Camera from '../lib/camera'
import Points from '../vis/points'
import Highlight from '../vis/highlight'

const FOV = 1
const NEAR = 0.1
const FAR = 50

class VisRenderer {
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    camera: Camera
    points: Points
    highlight: Highlight

    constructor (canvas: HTMLCanvasElement, data: GalaxyData) {
        this.gl = initGl(canvas)
        this.gl.enable(this.gl.DEPTH_TEST)

        this.model = mat4.create()

        const eye = vec3.fromValues(7.0, 0.0, 0.0)
        const focus = vec3.fromValues(0, 0, 0)
        const up = vec3.fromValues(0, 0, 1)
        this.view = mat4.lookAt(mat4.create(), eye, focus, up)

        const aspect = canvas.width / canvas.height
        this.proj = mat4.perspective(mat4.create(), FOV, aspect, NEAR, FAR)

        this.camera = new Camera(this.view, eye, focus, up)

        const inv = getInvMatrix([this.proj, this.view, this.model])
        this.points = new Points(this.gl, this.model, this.view, this.proj, inv, data)

        this.highlight = new Highlight(this.gl, this.model, this.view, this.proj)
    }

    colorMapField (data: GalaxyData, field: string | null): void {
        if (field) {
            this.points.colorMapField(this.gl, data, field)
        }
    }

    filter (data: GalaxyData, options: FilterOptions): void {
        this.points.filter(this.gl, data, options)
    }

    setSelectMode (selecting: boolean): void {
        this.points.setSelecting(selecting)
    }

    setupSelectHandlers (
        canvas: HTMLCanvasElement,
        setSelected: (ind: number) => void
    ): (() => void) {
        const removePointHandlers = this.points.setupSelectHandlers(
            this.gl,
            canvas,
            this.camera,
            setSelected
        )
        return removePointHandlers
    }

    setupHandlers (canvas: HTMLCanvasElement): (() => void) {
        const removeCameraHandlers = this.camera.setupHandlers(canvas)
        const removePointHandlers = this.points.setupHandlers(canvas)
        const resize = (): void => {
            const width = window.innerWidth * window.devicePixelRatio
            const height = window.innerHeight * window.devicePixelRatio
            mat4.perspective(this.proj, FOV, width / height, NEAR, FAR)
            this.gl.viewport(0, 0, width, height)

            this.gl.useProgram(this.points.program)
            this.points.setProjMatrix(this.proj)
            this.points.setDevicePixelRatio(window.devicePixelRatio)

            this.gl.useProgram(this.highlight.program)
            this.highlight.setProjMatrix(this.proj)
            this.highlight.setDevicePixelRatio(window.devicePixelRatio)
        }
        window.addEventListener('resize', resize)
        return (): void => {
            removeCameraHandlers()
            removePointHandlers()
            window.removeEventListener('resize', resize)
        }
    }

    draw (): void {
        this.camera.update()
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)

        this.highlight.draw(this.gl, this.view)

        const inv = getInvMatrix([this.proj, this.view, this.model])
        this.points.draw(this.gl, this.view, inv)
    }
}

export default VisRenderer
