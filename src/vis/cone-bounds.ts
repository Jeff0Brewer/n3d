import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import vertSource from '../shaders/cone-vert.glsl?raw'
import fragSource from '../shaders/sphere-frag.glsl?raw'

type Cone = {
    lat: number,
    lng: number,
    arc: number
}

const POS_FPV = 3
const NRM_FPV = 3

const CONE_LENGTH = 5
const CONE_DETAIL = 30
const DEG_TO_RAD = Math.PI / 180

const getConeVerts = (arc: number): Float32Array => {
    const verts = new Float32Array((CONE_DETAIL + 1) * 2 * (POS_FPV + NRM_FPV))
    let ind = 0

    const radius = CONE_LENGTH * Math.tan(arc * DEG_TO_RAD)
    const angleInc = Math.PI * 2 / CONE_DETAIL
    const maxAngle = Math.PI * 2 + angleInc
    for (let angle = 0; angle <= maxAngle; angle += angleInc) {
        // start at origin
        verts[ind++] = 0
        verts[ind++] = 0
        verts[ind++] = 0
        verts[ind++] = 0
        verts[ind++] = 0
        verts[ind++] = 0
        // go to circle in +y direction
        // since lat 0, lng 0 is +y axis
        verts[ind++] = Math.cos(angle) * radius
        verts[ind++] = CONE_LENGTH
        verts[ind++] = Math.sin(angle) * radius
        verts[ind++] = 0
        verts[ind++] = 0
        verts[ind++] = 0
    }
    return verts
}

class ConeBounds {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    numVertex: number
    drawing: boolean
    lastArc: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4
    ) {
        // compile shader program
        this.program = initProgram(gl, vertSource, fragSource)

        // init buffer with cone verts
        this.buffer = initBuffer(gl)
        this.numVertex = 0

        // init attributes
        const stride = POS_FPV + NRM_FPV
        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, stride, 0, gl.FLOAT)
        const bindNormal = initAttribute(gl, this.program, 'normal', NRM_FPV, stride, POS_FPV, gl.FLOAT)
        this.bindAttrib = (): void => {
            bindPosition()
            bindNormal()
        }

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')

        // init uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)

        // get closures to easily set uniforms
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }

        this.drawing = false
        this.lastArc = 0
    }

    updateCone (gl: WebGLRenderingContext, cone: Cone | null): void {
        if (!cone) {
            this.drawing = false
        } else {
            this.drawing = true

            gl.useProgram(this.program)

            if (cone.arc !== this.lastArc) {
                const verts = getConeVerts(cone.arc)
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
                gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
                this.numVertex = verts.length / (POS_FPV + NRM_FPV)
            }

            const rotationX = cone.lat * DEG_TO_RAD
            const rotationZ = -cone.lng * DEG_TO_RAD
            const rotation = mat4.create()
            mat4.rotateZ(rotation, rotation, rotationZ)
            mat4.rotateX(rotation, rotation, rotationX)
            this.setModelMatrix(rotation)
        }
    }

    draw (gl: WebGLRenderingContext, view: mat4): void {
        if (this.drawing) {
            gl.useProgram(this.program)
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
            this.bindAttrib()
            this.setViewMatrix(view)
            gl.depthMask(false)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
            gl.depthMask(true)
        }
    }
}

export default ConeBounds
export type { Cone }
