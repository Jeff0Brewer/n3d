import { Bezier } from 'bezier-js'

type Vec3 = [number, number, number]

type PathInstant = {
    position: Vec3,
    derivative: Vec3
}

interface PathType {
    get: (t: number) => PathInstant
}

class StaticPath implements PathType {
    position: Vec3
    derivative: Vec3

    constructor (position: Vec3) {
        this.position = position
        // derivative as -position so position + derivative yields origin
        this.derivative = [-position[0], -position[1], -position[2]]
    }

    get (): PathInstant {
        return {
            position: this.position,
            derivative: this.derivative
        }
    }
}

class LinearPath implements PathType {
    steps: Array<Vec3>

    constructor (positions: Array<Vec3>) {
        // prevent use of linear path for single point
        if (positions.length < 2) {
            throw new Error('Linear path requires at least 2 points')
        }
        this.steps = positions
    }

    get (t: number): PathInstant {
        const per = (this.steps.length - 1) * t
        const low = Math.floor(per)
        const high = Math.ceil(per)

        const a = this.steps[low]
        const b = this.steps[high]
        const lerpT = per - low

        // linear interpolate between low and high steps for position
        const position = lerp(a, b, lerpT)

        // since linear motion, derivative is in direction of low - high
        const derivative: Vec3 = [
            b[0] - a[0],
            b[1] - a[1],
            b[2] - a[2]
        ]

        return { position, derivative }
    }
}

class Point {
    x: number
    y: number
    z: number

    constructor (x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

    add (other: Point, factor?: number): Point {
        if (factor === undefined) { factor = 1 }
        return new Point(
            this.x + factor * other.x,
            this.y + factor * other.y,
            this.z + factor * other.z
        )
    }

    sub (other: Point, factor?: number): Point {
        if (factor === undefined) { factor = 1 }
        return this.add(other, -factor)
    }

    scale (factor: number): Point {
        return new Point(
            this.x * factor,
            this.y * factor,
            this.z * factor
        )
    }
}

class BezierPath implements PathType {
    beziers: Array<Bezier>

    constructor (positions: Array<Vec3>) {
        // don't need complex bezier calculation for < 3 points
        // since linear interpolation works fine
        if (positions.length < 3) {
            throw new Error('Bezier path requires at least 3 points')
        }

        // move position vectors into point class for calculation
        // and passing into bezier-js (requires x, y, z fields)
        const knots = positions.map(p => new Point(...p))

        const n = knots.length - 1 // number of bezier curves in final path
        const controlPoints = computeControlPoints(n, knots)

        this.beziers = Array(n)
        for (let i = 0; i < n; i++) {
            this.beziers[i] = new Bezier(
                knots[i],
                controlPoints[i],
                controlPoints[n + i],
                knots[i + 1]
            )
        }
    }

    get (t: number): PathInstant {
        if (t < 0 || t > 1) {
            throw new Error('Path only defined in range (0, 1)')
        }

        // get index of current bezier, and t value within that bezier
        const per = t * this.beziers.length
        const ind = Math.floor(per)
        const bezierT = per - ind

        const position = this.beziers[ind].get(bezierT)
        const derivative = this.beziers[ind].derivative(bezierT)

        if (position.z === undefined || derivative.z === undefined) {
            throw new Error('Bezier curves must contain 3d coordinates')
        }

        return {
            position: [position.x, position.y, position.z],
            derivative: [derivative.x, derivative.y, derivative.z]
        }
    }
}

// helpers to calculate bezier control points using Thomas' tridiagonal matrix algorithm
// number values for getVector fns from linear alg for calculating aligned control points
// ported from: https://www.stkent.com/2015/07/03/building-smooth-paths-using-bezier-curves.html

const getTargetVector = (n: number, knots: Array<Point>): Array<Point> => {
    const out: Array<Point> = Array(n)
    out[0] = knots[0].add(knots[1], 2)
    for (let i = 1; i < n - 1; i++) {
        out[i] = knots[i].scale(2).add(knots[i + 1]).scale(2)
    }
    out[n - 1] = knots[n - 1].scale(8).add(knots[n])
    return out
}

const getLowerDiagonalVector = (length: number): Float32Array => {
    const vec = new Float32Array(length)
    for (let i = 0; i < length - 1; i++) {
        vec[i] = 1
    }
    vec[length - 1] = 2
    return vec
}

const getMainDiagonalVector = (length: number): Float32Array => {
    const vec = new Float32Array(length)
    vec[0] = 2
    for (let i = 1; i < length - 1; i++) {
        vec[i] = 4
    }
    vec[length - 1] = 7
    return vec
}

const getUpperDiagonalVector = (length: number): Float32Array => {
    const vec = new Float32Array(length)
    vec.fill(1)
    return vec
}

const computeControlPoints = (n: number, knots: Array<Point>): Array<Point> => {
    const out: Array<Point> = Array(2 * n)

    const target = getTargetVector(n, knots)
    const lowerDiag = getLowerDiagonalVector(n - 1)
    const mainDiag = getMainDiagonalVector(n)
    const upperDiag = getUpperDiagonalVector(n - 1)

    const newTarget: Array<Point> = Array(n)
    const newUpperDiag = new Float32Array(n - 1)

    newTarget[0] = target[0].scale(1 / mainDiag[0])
    newUpperDiag[0] = upperDiag[0] / mainDiag[0]

    for (let i = 1; i < n - 1; i++) {
        newUpperDiag[i] = upperDiag[i] / (mainDiag[i] - lowerDiag[i - 1] * newUpperDiag[i - 1])
    }

    for (let i = 1; i < n; i++) {
        const targetScale = 1 / (mainDiag[i] - lowerDiag[i - 1] * newUpperDiag[i - 1])
        newTarget[i] = (
            target[i].sub(
                newTarget[i - 1].scale(lowerDiag[i - 1])
            )
        ).scale(targetScale)
    }

    out[n - 1] = newTarget[n - 1]
    for (let i = n - 2; i >= 0; i--) {
        out[i] = newTarget[i].sub(out[i + 1], newUpperDiag[i])
    }

    for (let i = 0; i < n - 1; i++) {
        out[n + i] = knots[i + 1].scale(2).sub(out[i + 1])
    }
    out[2 * n - 1] = knots[n].add(out[n - 1]).scale(0.5)

    return out
}

class DurationList {
    durations: Array<number>
    total: number

    constructor (durations: Array<number>) {
        // map individual durations to list of total
        // durations for fast index search
        let total = 0
        this.durations = durations.map(duration => {
            total += duration
            return total
        })
        this.durations.unshift(0)
        this.total = total
    }

    getT (time: number): number {
        if (time > this.total) {
            throw new Error(`Time must be in range of total duration ${this.total}`)
        }

        if (this.durations.length < 2) {
            return 0
        }

        let ind = 0
        while (time > this.durations[ind + 1]) {
            ind++
        }

        const low = this.durations[ind]
        const high = this.durations[ind + 1]
        const stepT = (time - low) / (high - low)

        return (ind + stepT) / (this.durations.length - 1)
    }
}

type CameraStep = {
    position: Vec3,
    focus: Vec3 | null
}

type CameraInstant = {
    position: Vec3,
    focus: Vec3
}

class CameraPath {
    steps: Array<CameraStep>
    path: BezierPath | LinearPath | StaticPath
    focuses: Array<Vec3 | null>
    duration: DurationList
    currFocus: [number, number, number]
    lastInd: number
    currTime: number

    constructor (
        steps: Array<CameraStep>,
        durations: Array<number>,
        smooth?: boolean
    ) {
        if (steps.length === 0) {
            throw new Error('Camera path requires > 0 steps')
        }
        this.steps = steps

        const positions = steps.map(step => step.position)
        // depending on number of positions, choose correct path type
        if (positions.length === 1) {
            this.path = new StaticPath(positions[0])
        } else if (positions.length >= 3 && smooth) {
            this.path = new BezierPath(positions)
        } else {
            this.path = new LinearPath(positions)
        }

        this.focuses = steps.map(step => step.focus)
        this.duration = new DurationList(durations)
        this.currFocus = this.focuses[0] || [0, 0, 0]
        this.lastInd = Number.MAX_VALUE
        this.currTime = 0
    }

    get (elapsed: number): CameraInstant {
        this.currTime = (this.currTime + elapsed) % this.duration.total
        const t = this.duration.getT(this.currTime)
        const { position, derivative } = this.path.get(t)

        const per = (this.focuses.length - 1) * t
        const focus = this.focuses[Math.round(per)] || [
            position[0] + derivative[0],
            position[1] + derivative[1],
            position[2] + derivative[2]
        ]

        if (this.lastInd > per) {
            this.currFocus = focus
        } else {
            // lerp t value from diff in per for consistency across
            // different durations / framerates
            const lerpT = (per - this.lastInd) * 10
            this.currFocus = lerp(this.currFocus, focus, lerpT)
        }
        this.lastInd = per

        return {
            position,
            focus: this.currFocus
        }
    }

    getPathTrace (): Float32Array {
        const tInc = 1 / (this.focuses.length * 30)
        const positions = []
        for (let t = 0; t <= 1; t += tInc) {
            const { position } = this.path.get(t)
            positions.push(...position)
        }
        return new Float32Array(positions)
    }

    getCameraPoints (): Float32Array {
        const positions = []
        for (const step of this.steps) {
            positions.push(...step.position)
        }
        return new Float32Array(positions)
    }

    getFocusLines (): Float32Array {
        const lines = []
        for (const step of this.steps) {
            if (step.focus) {
                const dir = scaleTo(sub(step.focus, step.position), 0.1)
                const focusDir = add(step.position, dir)
                lines.push(...step.position, ...focusDir)
            }
        }
        return new Float32Array(lines)
    }
}

const serializePath = (
    steps: Array<CameraStep>,
    durations: Array<number>,
    smooth: boolean
): string => {
    // first line denotes path smoothing
    let out = `${smooth ? 'smooth' : 'linear'}\n`

    // second line contains all durations
    for (let i = 0; i < durations.length; i++) {
        out += durations[i]
        if (i < durations.length - 1) {
            out += ', '
        }
    }
    out += '\n'

    // remaining lines contain steps
    for (let i = 0; i < steps.length; i++) {
        const { position, focus } = steps[i]
        const [px, py, pz] = position
        out += `${px}, ${py}, ${pz}, `

        if (focus !== null) {
            const [fx, fy, fz] = focus
            out += `${fx}, ${fy}, ${fz}`
        } else {
            out += 'null'
        }
        if (i < steps.length - 1) {
            out += '\n'
        }
    }

    return out
}

const deserializePath = (csv: string): {
    steps: Array<CameraStep>,
    durations: Array<number>,
    smooth: boolean
} => {
    const lines = csv.split('\n')
    if (lines.length < 3) {
        throw new Error('Incomplete path csv')
    }
    // separate smoothing / duration / steps lines
    const smoothingLine = lines[0]
    const durationsLine = lines[1]
    lines.splice(0, 2) // only steps remaining

    const smooth = smoothingLine.trim() === 'smooth'
    const durations = durationsLine.split(',').map(d => parseFloat(d))

    const steps: Array<CameraStep> = []
    for (const line of lines) {
        const row = line.split(',').map(v => v.trim())
        const step: CameraStep = {
            position: [
                parseFloat(row[0]),
                parseFloat(row[1]),
                parseFloat(row[2])
            ],
            focus: row[3] !== 'null'
                ? [
                    parseFloat(row[3]),
                    parseFloat(row[4]),
                    parseFloat(row[5])
                ]
                : null
        }
        steps.push(step)
    }

    return {
        steps,
        durations,
        smooth
    }
}

const add = (a: Vec3, b: Vec3): Vec3 => {
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2]
    ]
}

const sub = (a: Vec3, b: Vec3): Vec3 => {
    return [
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2]
    ]
}

const scaleTo = (v: Vec3, length: number): Vec3 => {
    const invMag = 1 / Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    return [
        v[0] * invMag * length,
        v[1] * invMag * length,
        v[2] * invMag * length
    ]
}

const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
    ]
}

export default CameraPath
export type { CameraStep }
export {
    serializePath,
    deserializePath
}
