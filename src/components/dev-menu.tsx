import React, { FC, useState } from 'react'
import type { Point } from 'bezier-js'
import { CameraPath } from '../lib/camera'
import styles from '../styles/dev-menu.module.css'

type DevMenuProps = {
    setCameraPath: (path: CameraPath | null) => void
}

const DevMenu: FC<DevMenuProps> = ({ setCameraPath }) => {
    const [p0, setP0] = useState<Point>({ x: 5, y: 0, z: 1 })
    const [p1, setP1] = useState<Point>({ x: -1, y: 1, z: -1 })
    const [p2, setP2] = useState<Point>({ x: 0, y: -5, z: 2 })
    const [duration, setDuration] = useState<number>(1000)

    const inputDuration = (e: React.ChangeEvent): void => {
        const value = getInputValue(e)
        setDuration(value)
    }

    const setPath = (): void => {
        const path = new CameraPath(p0, p1, p2, duration)
        setCameraPath(path)
    }

    return (
        <div className={styles.menu}>
            <PointInput label={'p0'} point={p0} setPoint={setP0} />
            <PointInput label={'p1'} point={p1} setPoint={setP1} />
            <PointInput label={'p2'} point={p2} setPoint={setP2} />
            <span className={styles.durationInput}>
                <p>duration:</p>
                <input
                    type={'text'}
                    defaultValue={duration}
                    onChange={inputDuration}
                />
            </span>
            <button
                className={styles.setButton}
                onClick={setPath}
            >set path</button>
        </div>
    )
}

type PointInputProps = {
    label: string,
    point: Point,
    setPoint: (point: Point) => void
}

const PointInput: FC<PointInputProps> = ({ label, point, setPoint }) => {
    const setX = (e: React.ChangeEvent): void => {
        const value = getInputValue(e)
        point.x = value
        setPoint({ ...point })
    }

    const setY = (e: React.ChangeEvent): void => {
        const value = getInputValue(e)
        point.y = value
        setPoint({ ...point })
    }

    const setZ = (e: React.ChangeEvent): void => {
        const value = getInputValue(e)
        point.z = value
        setPoint({ ...point })
    }

    return (
        <div className={styles.pointInput}>
            <p className={styles.pointLabel}>{label}</p>
            <span>
                <p>x:</p>
                <input
                    type={'text'}
                    defaultValue={point.x}
                    onChange={setX}
                />
            </span>
            <span>
                <p>y:</p>
                <input
                    type={'text'}
                    defaultValue={point.y}
                    onChange={setY}
                />
            </span>
            <span>
                <p>z:</p>
                <input
                    type={'text'}
                    defaultValue={point.z}
                    onChange={setZ}
                />
            </span>
        </div>
    )
}

const getInputValue = (e: React.ChangeEvent): number => {
    if (e.target instanceof HTMLInputElement) {
        const value = parseFloat(e.target.value)
        if (value) {
            return value
        }
    }
    throw new Error('Invalid input float value')
}

export default DevMenu
