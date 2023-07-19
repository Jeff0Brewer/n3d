import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import type { CsvData } from '../lib/data'
import Camera from '../lib/camera'
import Points from '../vis/points'

const FOV = 1
const NEAR = 0.1
const FAR = 50

class VisRenderer {
    gl: WebGLRenderingContext
    canvas: HTMLCanvasElement
    model: mat4
    view: mat4
    proj: mat4
    points: Points
    camera: Camera

    constructor (canvas: HTMLCanvasElement, data: CsvData) {
        this.gl = initGl(canvas)
        this.gl.enable(this.gl.DEPTH_TEST)
        this.canvas = canvas

        this.model = mat4.create()

        const eye = vec3.fromValues(1.0, 1.0, 1.0)
        const focus = vec3.fromValues(0, 0, 0)
        const up = vec3.fromValues(0, 0, 1)
        this.view = mat4.lookAt(mat4.create(), eye, focus, up)

        const aspect = canvas.width / canvas.height
        this.proj = mat4.perspective(mat4.create(), FOV, aspect, NEAR, FAR)

        this.camera = new Camera(this.model, this.view, eye, focus, up)
        this.points = new Points(this.gl, this.model, this.view, this.proj, data)
    }

    setupHandlers (canvas: HTMLCanvasElement): (() => void) {
        const removeCameraHandlers = this.camera.setupHandlers(canvas)
        const resize = (): void => {
            const width = window.innerWidth * window.devicePixelRatio
            const height = window.innerHeight * window.devicePixelRatio
            mat4.perspective(this.proj, FOV, width / height, NEAR, FAR)
            this.gl.viewport(0, 0, width, height)

            this.gl.useProgram(this.points.program)
            this.points.setProjMatrix(this.proj)
            this.points.setDevicePixelRatio(window.devicePixelRatio)
        }
        window.addEventListener('resize', resize)
        return (): void => {
            removeCameraHandlers()
            window.removeEventListener('resize', resize)
        }
    }

    draw (): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.points.draw(this.gl, this.model, this.view)
    }
}

export default VisRenderer
