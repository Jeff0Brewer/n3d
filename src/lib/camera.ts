import { mat4, vec3 } from 'gl-matrix'

const ROTATE_SPEED = 0.007
const ZOOM_SPEED = 0.0005

class Camera {
    model: mat4
    view: mat4
    eye: vec3
    focus: vec3
    up: vec3
    dragging: boolean

    constructor (model: mat4, view: mat4, eye: vec3, focus: vec3, up: vec3) {
        this.model = model
        this.view = view
        this.eye = eye
        this.focus = focus
        this.up = up
        this.dragging = false
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

        element.addEventListener('mousedown', dragTrue)
        element.addEventListener('mouseup', dragFalse)
        element.addEventListener('mouseleave', dragFalse)
        element.addEventListener('mousemove', rotate)
        element.addEventListener('wheel', zoom)

        return (): void => {
            element.removeEventListener('mousedown', dragTrue)
            element.removeEventListener('mouseup', dragFalse)
            element.removeEventListener('mouseleave', dragFalse)
            element.removeEventListener('mousemove', rotate)
            element.removeEventListener('wheel', zoom)
        }
    }

    scrollZoom (delta: number): void {
        const scale = 1.0 - delta * ZOOM_SPEED
        const viewVec = vec3.create()
        vec3.subtract(viewVec, this.eye, this.focus)
        vec3.scaleAndAdd(this.eye, this.focus, viewVec, scale)
        mat4.lookAt(this.view, this.eye, this.focus, this.up)
    }

    mouseRotate (dx: number, dy: number): void {
        // get axis perpendicular to current screen horizontally
        const invModel = mat4.create()
        mat4.invert(invModel, this.model)
        const axis = vec3.create()
        vec3.subtract(axis, this.focus, this.eye)
        vec3.cross(axis, axis, this.up)
        vec3.transformMat4(axis, axis, invModel)
        vec3.normalize(axis, axis)

        const rotationX = dy * ROTATE_SPEED
        const rotationZ = dx * ROTATE_SPEED
        mat4.rotate(this.model, this.model, rotationX, axis)
        mat4.rotate(this.model, this.model, rotationZ, this.up)
    }
}

export default Camera
