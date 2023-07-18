import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
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

    constructor (canvas: HTMLCanvasElement, positions: Float32Array) {
        this.gl = initGl(canvas)
        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
        this.canvas = canvas

        this.model = mat4.create()

        const eye = vec3.fromValues(1.0, 1.0, 1.0)
        const focus = vec3.fromValues(0, 0, 0)
        const up = vec3.fromValues(0, 0, 1)
        this.view = mat4.lookAt(mat4.create(), eye, focus, up)

        const aspect = canvas.width / canvas.height
        this.proj = mat4.perspective(mat4.create(), FOV, aspect, NEAR, FAR)

        this.camera = new Camera(this.model, eye, focus, up)

        this.points = new Points(
            this.gl,
            this.model,
            this.view,
            this.proj,
            positions
        )
    }

    setupHandlers (canvas: HTMLCanvasElement): (() => void) {
        const rotate = (e: MouseEvent): void => {
            this.camera.mouseRotate(e.movementX, e.movementY)
        }
        canvas.addEventListener('mousemove', rotate)
        const removeCameraHandlers = this.camera.setupEventHandlers(canvas)
        return (): void => {
            removeCameraHandlers()
            canvas.removeEventListener('mousemove', rotate)
        }
    }

    draw (): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.points.draw(this.gl, this.model)
    }
}

export default VisRenderer
