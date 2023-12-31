import { vec3 } from 'gl-matrix'
import type { GalaxyData } from '../lib/data'

class ColorMap {
    colors: Array<vec3>

    constructor (colors: Array<string>) {
        this.colors = colors.map(hex => colorHexToFloat(hex))
    }

    map (percentage: number): vec3 {
        if (percentage <= 0) { return this.colors[0] }
        if (percentage >= 1) { return this.colors[this.colors.length - 1] }

        const ind = (this.colors.length - 1) * percentage
        const lowInd = Math.floor(ind)
        const highInd = Math.ceil(ind)
        const indPer = (ind - lowInd) / (highInd - lowInd)

        const color = vec3.create()
        vec3.lerp(color, this.colors[lowInd], this.colors[highInd], indPer)
        return color
    }
}

const colorHexToFloat = (hex: string): vec3 => {
    const color = vec3.create()
    for (let i = 0; i < 3; i++) {
        color[i] = parseInt(hex.substr(i * 2, 2), 16) / 255
    }
    return color
}

const colorFloatToHex = (float: vec3): string => {
    const [x, y, z] = float
    const hex =
        Math.round(x * 255).toString(16) +
        Math.round(y * 255).toString(16) +
        Math.round(z * 255).toString(16)
    return hex
}

const colorArrToGradient = (colors: Array<string>): string => {
    let inner = ''
    for (const color of colors) {
        inner += `#${color}, `
    }
    inner = inner.substr(0, inner.length - 2)
    return `linear-gradient(to right, ${inner})`
}

type ColorField = {
    name: string,
    min: number,
    max: number,
    currMin: number,
    currMax: number
}

const getColorField = (data: GalaxyData, field: string): ColorField => {
    const { headers, entries } = data
    const fieldInd = headers.numHeaders[field]
    let min = Number.MAX_VALUE
    let max = Number.MIN_VALUE
    for (const entry of entries) {
        const value = entry.numValues[fieldInd]
        if (!Number.isNaN(value)) {
            min = Math.min(min, value)
            max = Math.max(max, value)
        }
    }
    return {
        name: field,
        min,
        max,
        currMin: min,
        currMax: max
    }
}

export default ColorMap
export type { ColorField }
export {
    colorArrToGradient,
    getColorField,
    colorFloatToHex
}
