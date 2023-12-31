import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import { getInvMatrix } from '../lib/unproject'
import Camera from '../lib/camera'
import Points from '../vis/points'
import Landmarks from '../vis/landmarks'
import Highlight from '../vis/highlight'
import SphereBounds from '../vis/sphere-bounds'
import ConeBounds from '../vis/cone-bounds'
import CameraTrace from '../vis/camera-trace'
import CameraAxis from '../vis/camera-axis'
import CameraPath from '../lib/camera-path'
import type { GalaxyData, Landmark } from '../lib/data'
import type { ColorField } from '../lib/color-map'
import type { Selection } from '../components/select-menu'
import type { Sphere } from '../vis/sphere-bounds'
import type { Cone } from '../vis/cone-bounds'

const FOV = 1
const NEAR = 0.01
const FAR = 50

const DEFAULT_POINT_SIZE = 6
const HIGHLIGHT_POINT_INC = 10

class VisRenderer {
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    camera: Camera
    points: Points
    landmarks: Landmarks
    highlight: Highlight
    sphereBounds: SphereBounds
    coneBounds: ConeBounds
    cameraTrace: CameraTrace
    cameraAxis: CameraAxis
    drawLandmarks: boolean
    drawCameraPath: boolean
    pointSize: number

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

        const eye = vec3.fromValues(-7, 0, 0)
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
        this.landmarks = new Landmarks(this.gl, this.model, this.view, this.proj, landmarkData)
        this.cameraTrace = new CameraTrace(this.gl, this.model, this.view, this.proj)
        this.cameraAxis = new CameraAxis(this.gl, this.model, this.view, this.proj)

        this.drawLandmarks = true
        this.drawCameraPath = true

        this.pointSize = DEFAULT_POINT_SIZE
    }

    resetCamera (data: GalaxyData): void {
        this.camera.reset()
        this.setSelected(data, null)
    }

    setCameraPath (path: CameraPath | null): void {
        this.camera.setPath(path)
    }

    setTracePath (path: CameraPath | null): void {
        this.cameraTrace.setPath(this.gl, path)
    }

    setAxisPosition (pos: [number, number, number] | null): void {
        this.cameraAxis.setPosition(this.gl, pos)
    }

    setDrawLandmarks (draw: boolean): void {
        this.drawLandmarks = draw
    }

    setDrawCameraPath (draw: boolean): void {
        this.drawCameraPath = draw
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
        setSelected: (ind: number) => void,
        setHovered: (ind: number) => void
    ): (() => void) {
        const removePointHandlers = this.points.setupSelectHandlers(
            this.gl,
            canvas,
            setSelected,
            setHovered
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

            this.gl.useProgram(this.landmarks.spheres.program)
            this.landmarks.spheres.setProjMatrix(this.proj)

            this.gl.useProgram(this.landmarks.labels.program)
            this.landmarks.labels.setProjMatrix(this.proj)

            this.gl.useProgram(this.sphereBounds.program)
            this.sphereBounds.setProjMatrix(this.proj)

            this.gl.useProgram(this.coneBounds.program)
            this.coneBounds.setProjMatrix(this.proj)

            this.gl.useProgram(this.cameraTrace.program)
            this.cameraTrace.setProjMatrix(this.proj)

            this.gl.useProgram(this.cameraAxis.program)
            this.cameraAxis.setProjMatrix(this.proj)
        }

        const keyDown = (e: KeyboardEvent): void => {
            if (e.key !== '+' && e.key !== '-') {
                return
            }
            this.pointSize += e.key === '+' ? 1 : -1
            this.gl.useProgram(this.points.program)
            this.points.setPointSize(this.pointSize)
            this.gl.useProgram(this.highlight.program)
            this.highlight.setPointSize(this.pointSize + HIGHLIGHT_POINT_INC)
        }

        window.addEventListener('resize', resize)
        window.addEventListener('keydown', keyDown)
        return (): void => {
            removeCameraHandlers()
            removePointHandlers()
            window.removeEventListener('resize', resize)
            window.removeEventListener('keydown', keyDown)
        }
    }

    setSphereBounds (sphere: Sphere | null): void {
        this.sphereBounds.updateSphere(this.gl, sphere)
    }

    setConeBounds (cone: Cone | null): void {
        this.coneBounds.updateCone(this.gl, cone)
    }

    draw (landmarks: Array<Landmark>, elapsed: number): void {
        const eye = this.camera.update(elapsed)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)

        const inv = getInvMatrix([this.proj, this.view, this.model])
        this.points.draw(this.gl, this.view, inv, eye)
        this.highlight.draw(this.gl, this.view)
        this.sphereBounds.draw(this.gl, this.view)
        this.coneBounds.draw(this.gl, this.view)
        if (this.drawLandmarks) {
            this.landmarks.draw(this.gl, this.view, landmarks, this.camera.eye)
        }
        if (this.drawCameraPath) {
            this.cameraAxis.draw(this.gl, this.view)
            this.cameraTrace.draw(this.gl, this.view)
        }
    }
}

export default VisRenderer
export {
    DEFAULT_POINT_SIZE,
    HIGHLIGHT_POINT_INC
}
