import React, { FC, useState, useEffect, useRef } from 'react'
import type { GalaxyData } from '../lib/data'
import type { Selection } from '../components/select-menu'
import type { Cone } from '../vis/cone-bounds'
import styles from '../styles/select-modes.module.css'

const DEG_TO_RAD = Math.PI / 180
function haversineDist (lat0: number, lng0: number, lat1: number, lng1: number): number {
    const lat0Cos = Math.cos(lat0 * DEG_TO_RAD)
    const lat1Cos = Math.cos(lat1 * DEG_TO_RAD)
    const latSin = Math.sin(((lat1 - lat0) * DEG_TO_RAD) / 2)
    const lngSin = Math.sin(((lng1 - lng0) * DEG_TO_RAD) / 2)
    const x = latSin * latSin + lngSin * lngSin * lat0Cos * lat1Cos
    const angle = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
    return angle / DEG_TO_RAD
}

const setFromInput = (set: (value: number) => void): ((e: React.ChangeEvent) => void) => {
    return (e: React.ChangeEvent): void => {
        if (e.target instanceof HTMLInputElement) {
            const value = parseFloat(e.target.value)
            set(value)
        }
    }
}

type ConeSelectProps = {
    data: GalaxyData,
    selected: number | null,
    selectionCount: number,
    addSelection: (selection: Selection) => void,
    setCone: (cone: Cone | null) => void
}

const ConeSelect: FC<ConeSelectProps> = ({
    data, selected, selectionCount, addSelection, setCone
}) => {
    const [lat, setLat] = useState<number>(0)
    const [lng, setLng] = useState<number>(0)
    const [arc, setArc] = useState<number>(10)
    const latInputRef = useRef<HTMLInputElement>(null)
    const lngInputRef = useRef<HTMLInputElement>(null)

    const coneSelect = (): void => {
        const { headers, entries } = data
        const latInd = headers.numHeaders.LAT
        const lngInd = headers.numHeaders.LON

        const inds = []
        for (let i = 0; i < entries.length; i++) {
            const distance = haversineDist(
                entries[i].numValues[latInd],
                entries[i].numValues[lngInd],
                lat,
                lng
            )
            if (distance < arc) {
                inds.push(i)
            }
        }
        addSelection({
            name: `Cone ${selectionCount}`,
            key: selectionCount,
            visible: true,
            inds
        })
    }

    // set lat / lng current selected galaxy or [0, 0] if none selected
    useEffect(() => {
        if (selected !== null) {
            const { headers, entries } = data
            const latInd = headers.numHeaders.LAT
            const lngInd = headers.numHeaders.LON
            const lat = entries[selected].numValues[latInd]
            const lng = entries[selected].numValues[lngInd]
            setLat(lat)
            setLng(lng)
            if (latInputRef.current && lngInputRef.current) {
                latInputRef.current.value = lat.toString()
                lngInputRef.current.value = lng.toString()
            }
        }
    }, [data, selected])

    // update cone on lat / lng / arc changes
    useEffect(() => {
        setCone({ lat, lng, arc })
    }, [lat, lng, arc, setCone])

    return (
        <div className={styles.wrap}>
            <p className={styles.header}>lat</p>
            <div className={styles.angleValue}>
                <p>{`${lat.toFixed(2)}°`}</p>
                <input
                    ref={latInputRef}
                    type={'range'}
                    min={-90}
                    max={90}
                    step={0.01}
                    defaultValue={lat}
                    onChange={setFromInput(setLat)}
                />
            </div>
            <p className={styles.header}>lng</p>
            <div className={styles.angleValue}>
                <p>{`${lng.toFixed(2)}°`}</p>
                <input
                    ref={lngInputRef}
                    type={'range'}
                    min={0}
                    max={360}
                    step={0.01}
                    defaultValue={lng}
                    onChange={setFromInput(setLng)}
                />
            </div>
            <p className={styles.header}>arc</p>
            <div className={styles.angleValue}>
                <p>{`${arc.toFixed(2)}°`}</p>
                <input
                    type={'range'}
                    min={0}
                    max={90}
                    step={0.01}
                    defaultValue={arc}
                    onChange={setFromInput(setArc)}
                />
            </div>
            <button
                className={styles.createButton}
                onClick={coneSelect}
            > create </button>
        </div>
    )
}

export default ConeSelect
