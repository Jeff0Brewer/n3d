import React, { FC, useState, useRef, useEffect } from 'react'
import { HiMiniVideoCamera, HiEye, HiMiniXMark, HiMiniPlus } from 'react-icons/hi2'
import { IoMdPlay } from 'react-icons/io'
import { PiWaveSawtoothBold, PiWaveSineBold } from 'react-icons/pi'
import { FaFileDownload, FaFileUpload } from 'react-icons/fa'
import { downloadTxt } from '../lib/export'
import CameraPath, { serializePath, deserializePath } from '../lib/camera-path'
import type { CameraStep } from '../lib/camera-path'
import styles from '../styles/camera-menu.module.css'

type CameraMenuProps = {
    setCameraPath: (path: CameraPath | null) => void,
    getCameraPosition: () => [number, number, number],
    getCameraFocus: () => [number, number, number]
}

const CameraMenu: FC<CameraMenuProps> = ({
    setCameraPath, getCameraPosition, getCameraFocus
}) => {
    const [steps, setSteps] = useState<Array<CameraStep>>([])
    const [duration, setDuration] = useState<number>(10)
    const [smooth, setSmooth] = useState<boolean>(true)
    const [visible, setVisible] = useState<boolean>(true)
    const durationRef = useRef<HTMLInputElement>(null)

    // setup key event to toggle visibility on ctrl+m
    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            if (e.ctrlKey && e.key === 'm') {
                setVisible(!visible)
            }
        }
        window.addEventListener('keydown', onKey)
        return (): void => {
            window.removeEventListener('keydown', onKey)
        }
    }, [visible])

    const appendStep = (): void => {
        const step: CameraStep = {
            position: getCameraPosition(),
            focus: null
        }
        setSteps([...steps, step])
    }

    const getStepSetter = (ind: number): ((step: CameraStep) => void) => {
        return (step: CameraStep): void => {
            steps[ind] = step
            setSteps([...steps])
        }
    }

    const getStepRemover = (ind: number): (() => void) => {
        return (): void => {
            steps.splice(ind, 1)
            setSteps([...steps])
        }
    }

    const updateDuration = (e: React.ChangeEvent): void => {
        if (!(e.target instanceof HTMLInputElement)) {
            throw new Error('Cannot get value from non-input element')
        }
        const value = parseFloat(e.target.value)
        if (!Number.isNaN(value)) {
            setDuration(value)
        }
    }

    const startCameraPath = (): void => {
        if (steps.length === 0) {
            setCameraPath(null)
        } else {
            const path = new CameraPath(steps, duration * 1000, smooth)
            setCameraPath(path)
        }
    }

    const downloadPath = (): void => {
        const csv = serializePath(steps, duration, smooth)
        downloadTxt('n3d_camera_path.csv', csv)
    }

    const uploadPath = (e: React.ChangeEvent): void => {
        if (!(e.target instanceof HTMLInputElement) || !e.target.files) {
            throw new Error('Cannot get file upload from non-input element')
        }
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e): void => {
                const csv = e.target?.result
                if (typeof csv === 'string') {
                    const { steps, duration, smooth } = deserializePath(csv)
                    setSteps(steps)
                    setSmooth(smooth)
                    setDuration(duration)
                    if (durationRef.current) {
                        durationRef.current.value = duration.toString()
                    }
                }
            }
            reader.readAsText(file)
        }
    }

    if (!visible) { return <></> }
    return (
        <div className={styles.menu}>
            { steps.length !== 0 &&
                <div className={styles.steps}>
                    { steps.map((step: CameraStep, i: number) =>
                        <StepInput
                            step={step}
                            setStep={getStepSetter(i)}
                            removeStep={getStepRemover(i)}
                            getCameraPosition={getCameraPosition}
                            getCameraFocus={getCameraFocus}
                            key={i}
                        />
                    )}
                </div>
            }
            <div className={styles.menuRow}>
                <button
                    className={styles.addStep}
                    onClick={appendStep}
                >
                    <HiMiniPlus />
                </button>
                <span className={styles.duration}>
                    <input
                        ref={durationRef}
                        type={'text'}
                        defaultValue={duration}
                        onChange={updateDuration}
                    />
                    <p>sec</p>
                </span>
            </div>
            <div className={styles.bottomControls}>
                <button onClick={(): void => setSmooth(!smooth)}>
                    { smooth
                        ? <PiWaveSineBold />
                        : <PiWaveSawtoothBold /> }
                </button>
                <div>
                    <button onClick={downloadPath}>
                        <FaFileDownload />
                    </button>
                    <label className={styles.upload}>
                        <input
                            type={'file'}
                            onChange={uploadPath}
                        />
                        <FaFileUpload />
                    </label>
                </div>
                <button onClick={startCameraPath}>
                    <IoMdPlay />
                </button>
            </div>
        </div>
    )
}

type StepInputProps = {
    step: CameraStep,
    setStep: (step: CameraStep) => void,
    removeStep: () => void,
    getCameraPosition: () => [number, number, number],
    getCameraFocus: () => [number, number, number]
}

const StepInput: FC<StepInputProps> = ({
    step, setStep, removeStep, getCameraPosition, getCameraFocus
}) => {
    const [key, setKey] = useState<number>(0)

    const updateStep = (updateKey?: boolean): void => {
        // don't need object copy since steps state is copied
        // in camera menu on setStep
        setStep(step)
        if (updateKey) {
            // inc key state to update child point input
            // values on non-input state changes
            setKey(key + 1)
        }
    }

    const setPosition = (point: [number, number, number], updateKey?: boolean): void => {
        step.position = point
        updateStep(updateKey)
    }

    const setFocus = (focus: [number, number, number] | null, updateKey?: boolean): void => {
        step.focus = focus
        updateStep(updateKey)
    }

    return (
        <div className={styles.step}>
            <div className={styles.stepRow}>
                <button
                    className={styles.icon}
                    onClick={(): void => setPosition(getCameraPosition(), true)}
                >
                    <HiMiniVideoCamera />
                </button>
                <PointInput point={step.position} setPoint={setPosition} key={key} />
                <button
                    className={styles.icon}
                    onClick={(): void => removeStep()}
                >
                    <HiMiniXMark />
                </button>
                { step.focus === null &&
                    <button
                        className={styles.icon}
                        onClick={(): void => setFocus(getCameraFocus(), true)}
                    >
                        <HiEye />
                    </button> }
            </div>
            { step.focus !== null &&
                <div className={styles.stepRow}>
                    <button
                        className={styles.icon}
                        onClick={(): void => setFocus(getCameraFocus(), true)}
                    >
                        <HiEye />
                    </button>
                    <PointInput point={step.focus} setPoint={setFocus} key={key + 1} />
                    <button
                        className={styles.icon}
                        onClick={(): void => setFocus(null, true)}
                    >
                        <HiMiniXMark />
                    </button>
                </div>
            }
        </div>
    )
}

type PointInputProps = {
    point: [number, number, number],
    setPoint: (point: [number, number, number]) => void
}

const PointInput: FC<PointInputProps> = ({ point, setPoint }) => {
    const getIndSetter = (ind: number): ((e: React.ChangeEvent) => void) => {
        return (e: React.ChangeEvent): void => {
            if (!(e.target instanceof HTMLInputElement)) {
                throw new Error('Cannot get value from non-input element')
            }
            const value = parseFloat(e.target.value)
            if (!Number.isNaN(value)) {
                point[ind] = value
                // don't need array copy since camera state is full steps array
                // and is copied in camera menu on change
                setPoint(point)
            }
        }
    }

    const DEFAULT_PRECISION = 2
    return (
        <div className={styles.pointInput}>
            <input
                type={'text'}
                defaultValue={point[0].toFixed(DEFAULT_PRECISION)}
                onChange={getIndSetter(0)}
            />
            <input
                type={'text'}
                defaultValue={point[1].toFixed(DEFAULT_PRECISION)}
                onChange={getIndSetter(1)}
            />
            <input
                type={'text'}
                defaultValue={point[2].toFixed(DEFAULT_PRECISION)}
                onChange={getIndSetter(2)}
            />
        </div>
    )
}

export default CameraMenu
