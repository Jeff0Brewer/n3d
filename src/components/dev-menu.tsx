import React, { FC, useState, useEffect } from 'react'
import type { Point } from 'bezier-js'
import { CameraPath } from '../lib/camera'
import styles from '../styles/dev-menu.module.css'

type DevMenuProps = {
    setCameraPath: (path: CameraPath | null) => void
}

const DevMenu: FC<DevMenuProps> = ({ setCameraPath }) => {
    const [visible, setVisible] = useState<boolean>(false)
    const [p0, setP0] = useState<Point>({ x: 5, y: 0, z: 1 })
    const [p1, setP1] = useState<Point>({ x: 0, y: 0, z: 0 })
    const [p2, setP2] = useState<Point>({ x: 0, y: -5, z: 2 })
    const [focus, setFocus] = useState<Point | null>(null)
    const [duration, setDuration] = useState<number>(1000)

    const inputDuration = (e: React.ChangeEvent): void => {
        const value = getInputValue(e)
        if (value !== null) {
            setDuration(value)
        }
    }

    const setPath = (): void => {
        const path = new CameraPath(p0, p1, p2, focus, duration)
        setCameraPath(path)
    }

    useEffect(() => {
        const keyDown = (e: KeyboardEvent): void => {
            if (e.ctrlKey && e.key === 'm') {
                setVisible(!visible)
            }
        }
        window.addEventListener('keydown', keyDown)
        return (): void => {
            window.removeEventListener('keydown', keyDown)
        }
    }, [visible])

    if (!visible) { return <></> }
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
            { !focus
                ? <button
                    className={styles.focusButton}
                    onClick={(): void => setFocus({ x: 0, y: 0, z: 0 })}
                >
                    add focus
                </button>
                : <>
                    <PointInput label={'focus'} point={focus} setPoint={setFocus} />
                    <button
                        className={styles.focusButton}
                        onClick={(): void => setFocus(null)}
                    >
                        remove focus
                    </button>
                </>
            }
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
        if (value !== null) {
            point.x = value
            setPoint({ ...point })
        }
    }

    const setY = (e: React.ChangeEvent): void => {
        const value = getInputValue(e)
        if (value !== null) {
            point.y = value
            setPoint({ ...point })
        }
    }

    const setZ = (e: React.ChangeEvent): void => {
        const value = getInputValue(e)
        if (value !== null) {
            point.z = value
            setPoint({ ...point })
        }
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

const getInputValue = (e: React.ChangeEvent): number | null => {
    if (e.target instanceof HTMLInputElement) {
        const value = parseFloat(e.target.value)
        if (!Number.isNaN(value)) {
            return value
        }
    }
    return null
}

export default DevMenu
