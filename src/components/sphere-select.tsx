import React, { FC, useState, useEffect, useRef } from 'react'
import { vec3 } from 'gl-matrix'
import type { GalaxyData } from '../lib/data'
import type { Selection } from '../components/select-menu'
import styles from '../styles/select-modes.module.css'

type SphereSelectProps = {
    data: GalaxyData,
    selected: number | null,
    selectionCount: number,
    setSelection: (selection: Selection) => void
}

const SphereSelect: FC<SphereSelectProps> = ({ data, selected, selectionCount, setSelection }) => {
    const [center, setCenter] = useState<vec3>(vec3.create())
    const [centerName, setCenterName] = useState<string | null>(null)
    const [radius, setRadius] = useState<number>(1)

    const inputRadius = (e: React.ChangeEvent): void => {
        if (!(e.target instanceof HTMLInputElement)) { return }
        const value = parseFloat(e.target.value)
        setRadius(value)
    }

    // set sphere center to current selected galaxy position
    // or [0, 0, 0] if none selected
    useEffect(() => {
        if (selected) {
            const nameInd = data.headers.strHeaders['Object Name']
            setCenterName(data.entries[selected].strValues[nameInd])
            setCenter(data.entries[selected].position)
        } else {
            setCenterName(null)
            setCenter(vec3.create())
        }
    }, [data, selected])

    // update selection on center / radius changes
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
            name: `Selection ${selectionCount}`,
            key: selectionCount,
            visible: true,
            inds
        })
    }, [data, center, radius, selectionCount, setSelection])

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
