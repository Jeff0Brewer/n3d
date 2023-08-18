import { mat4, vec3 } from 'gl-matrix'
import { Bezier } from 'bezier-js'
import type { Point } from 'bezier-js'

const ROTATE_SPEED = 0.007
const ZOOM_SPEED = 0.0005
const FOCUS_SPEED = 0.2

class CameraPath {
    // split 3d path into two 2d paths since
    // Bezier.quadradicFromPoints has unexpected behavior in 3d
    pathXY: Bezier
    pathXZ: Bezier
    focus: vec3 | null
    duration: number

    constructor (p0: Point, p1: Point, p2: Point, focus: Point | null, duration: number) {
        if (p0.z === undefined || p1.z === undefined || p2.z === undefined) {
            throw new Error('2d paths unsupported')
        }
        this.pathXY = Bezier.quadraticFromPoints(
            { x: p0.x, y: p0.y },
            { x: p1.x, y: p1.y },
            { x: p2.x, y: p2.y }
        )
        this.pathXZ = Bezier.quadraticFromPoints(
            { x: p0.x, y: p0.z },
            { x: p1.x, y: p1.z },
            { x: p2.x, y: p2.z }
        )
        if (focus && focus.z !== undefined) {
            this.focus = vec3.fromValues(focus.x, focus.y, focus.z)
        } else {
            this.focus = null
        }

        this.duration = duration
    }

    update (eye: vec3, focus: vec3, time: number): void {
        // get percentage of path from time / duration
        const per = time / (1000 * this.duration) % 1

        // get xy from pathXY and z from pathXZ
        const { x, y } = this.pathXY.get(per)
        const { y: z } = this.pathXZ.get(per)
        vec3.copy(eye, [x, y, z])

        if (!this.focus) {
            const { x: dx, y: dy } = this.pathXY.derivative(per)
            const { y: dz } = this.pathXZ.derivative(per)
            vec3.add(focus, eye, [dx, dy, dz])
        } else {
            vec3.copy(focus, this.focus)
        }
    }
}

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
    }

    update (time: number): vec3 {
        if (this.path) {
            this.path.update(this.eye, this.focus, time)
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

        this.path = null
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
export { CameraPath }
