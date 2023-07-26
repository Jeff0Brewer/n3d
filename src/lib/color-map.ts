import { vec3 } from 'gl-matrix'

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

const colorArrToGradient = (colors: Array<string>): string => {
    let inner = ''
    for (const color of colors) {
        inner += `#${color}, `
    }
    inner = inner.substr(0, inner.length - 2)
    return `linear-gradient(to right, ${inner})`
}

export default ColorMap

export {
    colorArrToGradient
}
