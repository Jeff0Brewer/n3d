import React, { FC, useState, useEffect } from 'react'
import { vec3 } from 'gl-matrix'
import type { GalaxyData } from '../lib/data'
import type { Selection } from '../components/select-menu'
import type { Sphere } from '../vis/sphere-bounds'
import styles from '../styles/select-modes.module.css'

const DEFAULT_POSITION = vec3.fromValues(0, 0, 0)
const DEFAULT_RADIUS = 1

type SphereSelectProps = {
    data: GalaxyData,
    selected: number | null,
    selectionCount: number,
    setSelection: (selection: Selection | null) => void,
    setSphere: (sphere: Sphere | null) => void
}

const SphereSelect: FC<SphereSelectProps> = ({
    data, selected, selectionCount, setSelection, setSphere
}) => {
    const [centerName, setCenterName] = useState<string | null>(null)
    const [center, setCenter] = useState<vec3>(DEFAULT_POSITION)
    const [radius, setRadius] = useState<number>(DEFAULT_RADIUS)

    const inputRadius = (e: React.ChangeEvent): void => {
        if (!(e.target instanceof HTMLInputElement)) { return }
        const value = parseFloat(e.target.value)
        setRadius(value)
    }

    // update selection on change
    useEffect(() => {
        const { entries } = data
        const inds = []
        for (let i = 0; i < entries.length; i++) {
            const { position } = entries[i]
            if (vec3.distance(position, center) < radius) {
                inds.push(i)
            }
        }
        setSelection({
            name: `Sphere ${selectionCount}`,
            key: selectionCount,
            visible: true,
            inds
        })
    }, [data, center, radius, selectionCount, setSelection])

    // set sphere center to current selected galaxy position
    // or [0, 0, 0] if none selected
    useEffect(() => {
        if (selected !== null) {
            const nameInd = data.headers.strHeaders['Object Name']
            setCenterName(data.entries[selected].strValues[nameInd])
            setCenter(data.entries[selected].position)
        } else {
            setCenterName(null)
            setCenter(DEFAULT_POSITION)
        }
    }, [data, selected])

    // update sphere prop on internal state changes
    useEffect(() => {
        setSphere({ center, radius })
    }, [center, radius, setSphere])

    return (
        <div className={styles.wrap}>
            <p className={styles.header}>center</p>
            <div className={styles.sphereCenter}>
                {centerName !== null &&
                    <p>{centerName}</p>}
                <span className={styles.sphereCoords}>
                    <p>{`x: ${center[0].toFixed(2)}`}</p>
                    <p>{`y: ${center[1].toFixed(2)}`}</p>
                    <p>{`z: ${center[2].toFixed(2)}`}</p>
                </span>
            </div>
            <p className={styles.header}>radius</p>
            <div className={styles.sphereRadius}>
                <p>{radius.toFixed(2)}</p>
                <input
                    type={'range'}
                    min={0}
                    max={2}
                    step={0.01}
                    defaultValue={radius}
                    onChange={inputRadius}
                />
            </div>
        </div>
    )
}

export default SphereSelect