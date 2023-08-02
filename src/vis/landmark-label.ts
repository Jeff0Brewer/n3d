import { mat4, vec3, quat } from 'gl-matrix'
import { initProgram, initBuffer, initTexture, initAttribute } from '../lib/gl-wrap'
import type { Landmark } from '../lib/data'
import vertSource from '../shaders/landmark-label-vert.glsl?raw'
import fragSource from '../shaders/landmark-label-frag.glsl?raw'

const POS_FPV = 2
const TEX_FPV = 2

const TEXT_WIDTH = 800
const TEXT_HEIGHT = 200

class LandmarkLabels {
    program: WebGLProgram
    textures: Array<WebGLTexture>
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setRotation: (mat: mat4) => void
    setCenter: (center: vec3) => void
    setSize: (width: number) => void
    numVertex: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        landmarks: Array<Landmark>
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        // get textures for each label
        const textRenderer = new TextRenderer(TEXT_WIDTH, TEXT_HEIGHT)
        this.textures = []
        for (const { name } of landmarks) {
            const data = textRenderer.getTextImage(name)
            this.textures.push(initTexture(gl))
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                TEXT_WIDTH,
                TEXT_HEIGHT,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                data
            )
        }

        const verts = getLabelVerts()
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / (POS_FPV + TEX_FPV)

        const stride = POS_FPV + TEX_FPV
        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, stride, 0, gl.FLOAT)
        const bindTexCoord = initAttribute(gl, this.program, 'texCoord', TEX_FPV, stride, POS_FPV, gl.FLOAT)
        this.bindAttrib = (): void => {
            bindPosition()
            bindTexCoord()
        }

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uRotation = gl.getUniformLocation(this.program, 'rotation')
        const uCenter = gl.getUniformLocation(this.program, 'center')
        const uSize = gl.getUniformLocation(this.program, 'size')

        // init mvp uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)

        // get closures to easily set uniforms
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setRotation = (mat: mat4): void => { gl.uniformMatrix4fv(uRotation, false, mat) }
        this.setCenter = (center: vec3): void => { gl.uniform3fv(uCenter, center) }
        const aspect = TEXT_HEIGHT / TEXT_WIDTH
        this.setSize = (width: number): void => { gl.uniform2f(uSize, width, width * aspect) }
    }

    draw (gl: WebGLRenderingContext, view: mat4, landmarks: Array<Landmark>): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindAttrib()
        this.setViewMatrix(view)

        // disable depth mask to prevent occlusion from transparent background
        gl.depthMask(false)
        const rotationQuat = quat.create()
        const rotation = mat4.create()
        for (let i = 0; i < landmarks.length; i++) {
            mat4.getRotation(rotationQuat, view)
            quat.invert(rotationQuat, rotationQuat)
            quat.normalize(rotationQuat, rotationQuat)
            mat4.fromQuat(rotation, rotationQuat)

            this.setRotation(rotation)
            this.setCenter(landmarks[i].position)
            this.setSize(landmarks[i].radius * 2)
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i])
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
        }
        gl.depthMask(true)
    }
}

const getLabelVerts = (): Float32Array => {
    const x = 0.5
    const y = 0.5
    // invert y tex coordinate to line up with
    // image data from canvas rendering
    return new Float32Array([
        -x, -y,
        0, 1,
        -x, y,
        0, 0,
        x, -y,
        1, 1,
        x, y,
        1, 0
    ])
}

class TextRenderer {
    ctx: CanvasRenderingContext2D
    width: number
    height: number

    constructor (width: number, height: number) {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
            throw new Error('Failed to get offscreen drawing context')
        }
        ctx.textAlign = 'center'
        ctx.fillStyle = '#fff'

        this.ctx = ctx
        this.width = width
        this.height = height
    }

    getTextImage (text: string): Uint8ClampedArray {
        this.ctx.clearRect(0, 0, this.width, this.height)

        // fit font size to fill canvas width
        let fontSize = 300
        do {
            fontSize -= 5
            this.ctx.font = `${fontSize}px sans-serif`
        } while (this.ctx.measureText(text).width > this.width)

        this.ctx.fillText(text, this.width * 0.5, this.height * 0.5, this.width)
        return this.ctx.getImageData(0, 0, this.width, this.height).data
    }
}

export default LandmarkLabels
