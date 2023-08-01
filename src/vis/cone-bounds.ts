import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import vertSource from '../shaders/sphere-vert.glsl?raw'
import fragSource from '../shaders/sphere-frag.glsl?raw'

type Cone = {
    lat: number,
    lng: number,
    arc: number
}

const POS_FPV = 3
const CONE_LENGTH = 6
const DEG_TO_RAD = Math.PI / 180

const getConeVerts = (detail: number): Float32Array => {
    const verts = new Float32Array(detail * 2 * POS_FPV)
    let ind = 0
    const setVert = (x: number, y: number, z: number): void => {
        verts[ind++] = x
        verts[ind++] = y
        verts[ind++] = z
    }

    const angleInc = Math.PI * 2 / detail
    for (let angle = 0; angle <= Math.PI * 2; angle += angleInc) {
        // start at origin
        setVert(0, 0, 0)
        // go to circle in +y direction
        // since lat 0, lng 0 is +y axis
        setVert(Math.cos(angle), CONE_LENGTH, Math.sin(angle))
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
    setRotation: (mat: mat4) => void
    setWidth: (width: number) => void
    numVertex: number
    drawing: boolean

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4
    ) {
        // compile shader program
        this.program = initProgram(gl, vertSource, fragSource)

        // init buffer with cone verts
        const verts = getConeVerts(30)
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / POS_FPV

        // init position attribute
        this.bindAttrib = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0, gl.FLOAT)

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uRotation = gl.getUniformLocation(this.program, 'rotation')
        const uWidth = gl.getUniformLocation(this.program, 'width')

        // init uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)

        // get closures to easily set uniforms
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setRotation = (mat: mat4): void => { gl.uniformMatrix4fv(uRotation, false, mat) }
        this.setWidth = (width: number): void => { gl.uniform1f(uWidth, width) }

        this.drawing = false
    }

    updateCone (gl: WebGLRenderingContext, cone: Cone | null): void {
        if (!cone) {
            this.drawing = false
        } else {
            this.drawing = true

            const width = CONE_LENGTH * Math.tan(cone.arc * DEG_TO_RAD)
            const rotationX = cone.lat * DEG_TO_RAD
            const rotationZ = cone.lng * DEG_TO_RAD
            const rotation = mat4.create()
            mat4.rotateZ(rotation, rotation, rotationZ)
            mat4.rotateX(rotation, rotation, rotationX)

            gl.useProgram(this.program)
            this.setWidth(width)
            this.setRotation(rotation)
        }
    }

    draw (gl: WebGLRenderingContext, view: mat4): void {
        if (this.drawing) {
            gl.useProgram(this.program)
            this.setViewMatrix(view)
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
            this.bindAttrib()
            gl.depthMask(false)
            gl.drawArrays(gl.TRIANGLES, 0, this.numVertex)
            gl.depthMask(true)
        }
    }
}

export default ConeBounds
export type { Cone }
