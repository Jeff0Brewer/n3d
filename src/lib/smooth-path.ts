import { Bezier } from 'bezier-js'

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

const getTargetVector = (n: number, knots: Array<Point>): Array<Point> => {
    const out: Array<Point> = []

    out.push(knots[0].add(knots[1], 2))
    for (let i = 1; i < n - 1; i++) {
        out.push(
            knots[i].scale(2).add(knots[i + 1]).scale(2)
        )
    }
    out.push(knots[n - 1].scale(8).add(knots[n]))

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

class SmoothPath {
    beziers: Array<Bezier>

    constructor (knots: Array<Point>) {
        if (knots.length < 3) {
            throw new Error('Smooth path must pass through minimum of 3 points')
        }
        this.beziers = []

        const n = knots.length - 1
        const controlPoints = computeControlPoints(n, knots)
        for (let i = 0; i < n; i++) {
            this.appendBezier(
                knots[i],
                knots[i + 1],
                controlPoints[i],
                controlPoints[n + i]
            )
        }
    }

    appendBezier (start: Point, end: Point, control1: Point, control2: Point): void {
        this.beziers.push(
            new Bezier(start, control1, control2, end)
        )
    }

    get (t: number): { pos: [number, number, number], foc: [number, number, number] } {
        if (t < 0 || t > 1) {
            throw new Error('Smooth path only defined in range (0, 1)')
        }
        const per = t * this.beziers.length
        const ind = Math.floor(per)
        const position = this.beziers[ind].get(per - ind)
        const focus = this.beziers[ind].derivative(per - ind)
        if (position.z === undefined || focus.z === undefined) {
            throw new Error('Bezier does not contain 3d points')
        }
        return {
            pos: [position.x, position.y, position.z],
            foc: [focus.x, focus.y, focus.z]
        }
    }
}

export default SmoothPath
export { Point }
