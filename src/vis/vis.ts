import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import { getInvMatrix } from '../lib/unproject'
import Camera from '../lib/camera'
import Points from '../vis/points'
import Highlight from '../vis/highlight'
import SphereBounds from '../vis/sphere-bounds'
import ConeBounds from '../vis/cone-bounds'
import type { GalaxyData, Landmark } from '../lib/data'
import type { ColorField } from '../lib/color-map'
import type { Selection } from '../components/select-menu'
import type { Sphere } from '../vis/sphere-bounds'
import type { Cone } from '../vis/cone-bounds'

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
    sphereBounds: SphereBounds
    coneBounds: ConeBounds

    constructor (
        canvas: HTMLCanvasElement,
        galaxyData: GalaxyData,
        landmarkData: Array<Landmark>
    ) {
        this.gl = initGl(canvas)
        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

        this.model = mat4.create()

        const eye = vec3.fromValues(7, 0, 0)
        const focus = vec3.fromValues(0, 0, 0)
        const up = vec3.fromValues(0, 0, 1)
        this.view = mat4.lookAt(mat4.create(), eye, focus, up)

        const aspect = canvas.width / canvas.height
        this.proj = mat4.perspective(mat4.create(), FOV, aspect, NEAR, FAR)

        this.camera = new Camera(this.view, eye, focus, up)

        const inv = getInvMatrix([this.proj, this.view, this.model])
        this.points = new Points(this.gl, this.model, this.view, this.proj, inv, galaxyData)
        this.highlight = new Highlight(this.gl, this.model, this.view, this.proj)
        this.sphereBounds = new SphereBounds(this.gl, this.model, this.view, this.proj)
        this.coneBounds = new ConeBounds(this.gl, this.model, this.view, this.proj)
    }

    resetCamera (data: GalaxyData): void {
        this.camera.reset()
        this.setSelected(data, null)
    }

    colorMapField (data: GalaxyData, field: ColorField | null): void {
        if (field) {
            this.points.colorMapField(this.gl, data, field)
        }
    }

    filterSelections (selections: Array<Selection>): void {
        this.points.filterSelections(this.gl, selections)
    }

    setSelected (data: GalaxyData, ind: number | null): void {
        if (ind !== null) {
            const pos = data.entries[ind].position
            this.camera.setFocus(pos)
            this.highlight.setPositions(this.gl, new Float32Array(pos))
        } else {
            this.highlight.setPositions(this.gl, new Float32Array(0))
        }
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

            this.gl.useProgram(this.sphereBounds.program)
            this.sphereBounds.setProjMatrix(this.proj)

            this.gl.useProgram(this.coneBounds.program)
            this.coneBounds.setProjMatrix(this.proj)
        }
        window.addEventListener('resize', resize)
        return (): void => {
            removeCameraHandlers()
            removePointHandlers()
            window.removeEventListener('resize', resize)
        }
    }

    setSphereBounds (sphere: Sphere | null): void {
        this.sphereBounds.updateSphere(this.gl, sphere)
    }

    setConeBounds (cone: Cone | null): void {
        this.coneBounds.updateCone(this.gl, cone)
    }

    draw (): void {
        this.camera.update()
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)

        const inv = getInvMatrix([this.proj, this.view, this.model])
        this.points.draw(this.gl, this.view, inv)
        this.highlight.draw(this.gl, this.view)
        this.sphereBounds.draw(this.gl, this.view)
        this.coneBounds.draw(this.gl, this.view)
    }
}

export default VisRenderer
