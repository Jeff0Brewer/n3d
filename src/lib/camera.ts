import { mat4, vec3 } from 'gl-matrix'
import CameraPath from '../lib/camera-path'

const ROTATE_SPEED = 0.007
const ZOOM_SPEED = 0.0005
const FOCUS_SPEED = 0.2

class Camera {
    view: mat4
    eye: vec3
    focus: vec3
    focusTarget: vec3
    up: vec3
    dragging: boolean
    defaultEye: vec3
    defaultFocus: vec3
    path: CameraPath | null
    autoRotate: boolean
    autoRotateSpeed: number

    constructor (view: mat4, eye: vec3, focus: vec3, up: vec3) {
        this.view = view
        this.eye = eye
        this.focus = focus
        this.focusTarget = focus
        this.up = up
        this.dragging = false
        this.defaultEye = vec3.clone(eye)
        this.defaultFocus = vec3.clone(focus)
        this.path = null
        this.autoRotate = false
        this.autoRotateSpeed = 0.05
    }

    update (elapsed: number): vec3 {
        if (this.autoRotate) {
            this.mouseRotate(this.autoRotateSpeed * elapsed, 0)
        }
        if (this.path) {
            const { position, focus } = this.path.get(elapsed)
            vec3.copy(this.eye, position)
            vec3.copy(this.focus, focus)
        } else {
            vec3.scale(this.focus, this.focus, 1 - FOCUS_SPEED)
            vec3.scaleAndAdd(this.focus, this.focus, this.focusTarget, FOCUS_SPEED)
        }
        mat4.lookAt(this.view, this.eye, this.focus, this.up)
        return this.eye
    }

    reset (): void {
        this.eye = vec3.clone(this.defaultEye)
        this.focus = vec3.clone(this.defaultFocus)
        this.focusTarget = vec3.clone(this.defaultFocus)
        mat4.lookAt(this.view, this.eye, this.focus, this.up)
    }

    setPath (path: CameraPath | null): void {
        this.path = path
        this.autoRotate = false
    }

    setupHandlers (element: HTMLElement): (() => void) {
        const dragTrue = (): void => { this.dragging = true }
        const dragFalse = (): void => { this.dragging = false }
        const rotate = (e: MouseEvent): void => {
            if (this.dragging) {
                this.mouseRotate(e.movementX, e.movementY)
            }
        }
        const zoom = (e: WheelEvent): void => {
            e.preventDefault()
            this.scrollZoom(e.deltaY)
        }
        const ROTATE_INC = 0.03
        const autoRotateKeys = (e: KeyboardEvent): void => {
            if (e.ctrlKey && e.key === 'r') {
                this.autoRotate = !this.autoRotate
            } else if (e.ctrlKey && e.key === ',') {
                this.autoRotateSpeed -= ROTATE_INC
            } else if (e.ctrlKey && e.key === '.') {
                this.autoRotateSpeed += ROTATE_INC
            }
        }

        element.addEventListener('mousedown', dragTrue)
        element.addEventListener('mouseup', dragFalse)
        element.addEventListener('mouseleave', dragFalse)
        element.addEventListener('mousemove', rotate)
        element.addEventListener('wheel', zoom)
        window.addEventListener('keydown', autoRotateKeys)

        return (): void => {
            element.removeEventListener('mousedown', dragTrue)
            element.removeEventListener('mouseup', dragFalse)
            element.removeEventListener('mouseleave', dragFalse)
            element.removeEventListener('mousemove', rotate)
            element.removeEventListener('wheel', zoom)
            window.removeEventListener('keydown', autoRotateKeys)
        }
    }

    setFocus (pos: vec3): void {
        this.focusTarget = pos
    }

    scrollZoom (delta: number): void {
        const scale = 1.0 - delta * ZOOM_SPEED
        const viewVec = vec3.create()
        vec3.subtract(viewVec, this.eye, this.focus)
        vec3.scaleAndAdd(this.eye, this.focus, viewVec, scale)
    }

    mouseRotate (dx: number, dy: number): void {
        const camVec = vec3.create()
        vec3.subtract(camVec, this.eye, this.focus)

        const axis = vec3.create()
        vec3.cross(axis, camVec, this.up)
        vec3.normalize(axis, axis)

        const rotationX = dy * ROTATE_SPEED
        const rotationZ = -dx * ROTATE_SPEED
        const rotation = mat4.create()
        mat4.rotate(rotation, rotation, rotationX, axis)
        mat4.rotate(rotation, rotation, rotationZ, this.up)
        vec3.transformMat4(camVec, camVec, rotation)

        // prevent rotations over (+/-)180deg vertically
        // only rotate if large enough angle between up vec and new cam vec
        const negUp = vec3.scale(vec3.create(), this.up, -1)
        if (vec3.angle(camVec, this.up) > 0.1 && vec3.angle(camVec, negUp) > 0.1) {
            vec3.add(this.eye, this.focus, camVec)
        }
    }
}

export default Camera
