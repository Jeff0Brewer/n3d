import { vec3 } from 'gl-matrix'

class ColorMap {
    colors: Array<vec3>

    constructor (colors: Array<string>) {
        this.colors = colors.map(hex => colorHexToByte(hex))
    }

    map (percentage: number): vec3 {
        if (percentage <= 0) { return this.colors[0] }
        if (percentage >= 1) { return this.colors[this.colors.length - 1] }

        const ind = this.colors.length * percentage
        const lowInd = Math.floor(ind)
        const highInd = Math.ceil(ind)
        const indPer = (ind - lowInd) / (highInd - lowInd)

        const color = vec3.create()
        vec3.lerp(color, this.colors[lowInd], this.colors[highInd], indPer)
        return color
    }
}

const colorHexToByte = (hex: string): vec3 => {
    const color = vec3.create()
    for (let i = 0; i < 3; i++) {
        color[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return color
}

export default ColorMap
