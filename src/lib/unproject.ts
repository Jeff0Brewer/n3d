import { mat4 } from 'gl-matrix'

const getInvMatrix = (mats: Array<mat4>): mat4 => {
    const inv = mat4.create()
    for (let i = mats.length - 1; i >= 0; i--) {
        const thisInv = mat4.invert(mat4.create(), mats[i])
        mat4.multiply(inv, inv, thisInv)
    }
    return inv
}

export {
    getInvMatrix
}
