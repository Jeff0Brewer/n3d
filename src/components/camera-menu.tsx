import React, { FC, useState, useEffect, useRef } from 'react'
import { HiMiniVideoCamera, HiEye, HiMiniXMark, HiMiniPlus } from 'react-icons/hi2'
import { IoMdPlay, IoMdPause, IoMdRewind, IoMdFastforward } from 'react-icons/io'
import { IoStopSharp } from 'react-icons/io5'
import { PiWaveSawtoothBold, PiWaveSineBold } from 'react-icons/pi'
import { FaFileDownload, FaFileUpload } from 'react-icons/fa'
import { downloadTxt } from '../lib/export'
import CameraPath, { serializePath, deserializePath } from '../lib/camera-path'
import type { CameraStep } from '../lib/camera-path'
import styles from '../styles/camera-menu.module.css'

const INPUT_PRECISION = 2 // decimals
const DEFAULT_DURATION = 1000 // ms

type CameraMenuProps = {
    setCameraPath: (path: CameraPath | null) => void,
    setTracePath: (path: CameraPath | null) => void,
    getCameraPosition: () => [number, number, number],
    getCameraFocus: () => [number, number, number]
}

const CameraMenu: FC<CameraMenuProps> = ({
    setCameraPath, getCameraPosition, getCameraFocus, setTracePath
}) => {
    const [steps, setSteps] = useState<Array<CameraStep>>([])
    const [durations, setDurations] = useState<Array<number>>([])
    const [smooth, setSmooth] = useState<boolean>(true)
    const [visible, setVisible] = useState<boolean>(false)
    const [minKey, setMinKey] = useState<number>(0)
    const [paused, setPaused] = useState<boolean>(true)
    const pathRef = useRef<CameraPath | null>(null)

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

    useEffect(() => {
        if (steps.length >= 2 && visible) {
            // fill duration / start time with arbitrary values,
            // only need steps / smoothing for path motion
            setTracePath(new CameraPath(steps, [1], smooth))
        } else {
            setTracePath(null)
        }
    }, [steps, smooth, visible, setTracePath])

    const incKey = (): void => {
        // increment key to update input values from state
        // increment by large value for no overlap with prior keys
        setMinKey((minKey + 1000) % 100000)
    }

    const appendStep = (): void => {
        // add new duration if not first step
        if (steps.length > 0) {
            setDurations([...durations, DEFAULT_DURATION])
        }
        setSteps([...steps, {
            position: getCameraPosition(),
            focus: null
        }])
    }

    const getStepSetter = (ind: number): ((step: CameraStep) => void) => {
        return (step: CameraStep): void => {
            steps[ind] = step
            setSteps([...steps])
        }
    }

    const getStepRemover = (ind: number): (() => void) => {
        return (): void => {
            if (ind + 1 < steps.length) {
                durations.splice(ind, 1)
                setDurations([...durations])
            } else if (ind - 1 > 0) {
                durations.splice(ind - 1, 1)
                setDurations([...durations])
            }
            steps.splice(ind, 1)
            setSteps([...steps])
            // increment keys to refresh input values
            incKey()
        }
    }

    const getDurationSetter = (ind: number): ((e: React.ChangeEvent) => void) => {
        return (e: React.ChangeEvent): void => {
            if (!(e.target instanceof HTMLInputElement)) {
                throw new Error('Cannot get value from non-input element')
            }
            const value = parseFloat(e.target.value)
            if (!Number.isNaN(value)) {
                durations[ind] = value * 1000
                setDurations([...durations])
            }
        }
    }

    const startCameraPath = (): void => {
        pathRef.current = steps.length !== 0
            ? new CameraPath(steps, durations, smooth)
            : null
        setCameraPath(pathRef.current)
        setPaused(false)
    }

    const prevStep = (): void => {
        if (pathRef.current !== null) {
            pathRef.current.prevStep()
        }
    }

    const nextStep = (): void => {
        if (pathRef.current !== null) {
            pathRef.current.nextStep()
        }
    }

    const stopPath = (): void => {
        pathRef.current = null
        setCameraPath(pathRef.current)
        setPaused(true)
    }

    const playPause = (): void => {
        if (pathRef.current === null) {
            startCameraPath()
        } else {
            pathRef.current.paused = !paused
            setPaused(pathRef.current.paused)
        }
    }

    const downloadPath = (): void => {
        const csv = serializePath(steps, durations, smooth)
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
                    const { steps, durations, smooth } = deserializePath(csv)
                    setSteps(steps)
                    setSmooth(smooth)
                    setDurations(durations)
                    // increment keys to refresh input values
                    incKey()
                }
            }
            reader.readAsText(file)
            e.target.value = ''
        }
    }

    if (!visible) { return <></> }
    return (
        <div className={styles.menu}>
            { steps.length !== 0 && <div className={styles.steps}>
                { steps.map((step: CameraStep, i: number) =>
                    <div key={i + minKey} className={styles.stepWrap}>
                        <StepInput
                            step={step}
                            setStep={getStepSetter(i)}
                            removeStep={getStepRemover(i)}
                            getCameraPosition={getCameraPosition}
                            getCameraFocus={getCameraFocus}
                        />
                        { i < steps.length - 1 &&
                            <span className={styles.duration}>
                                <input
                                    type={'text'}
                                    defaultValue={durations[i] / 1000}
                                    onChange={getDurationSetter(i)}
                                />
                                <p>sec</p>
                            </span> }
                    </div>
                )}
            </div> }
            <div className={styles.menuRow}>
                <button className={styles.addStep} onClick={appendStep}>
                    <HiMiniPlus />
                </button>
                <button className={styles.startButton} onClick={startCameraPath}>
                    set path
                </button>
            </div>
            <div className={styles.bottomControls}>
                <button onClick={(): void => setSmooth(!smooth)}>
                    { smooth
                        ? <PiWaveSineBold />
                        : <PiWaveSawtoothBold /> }
                </button>
                <div className={styles.playControls}>
                    <button onClick={prevStep}>
                        <IoMdRewind />
                    </button>
                    <button onClick={stopPath}>
                        <IoStopSharp />
                    </button>
                    <button onClick={playPause}>
                        { paused
                            ? <IoMdPlay />
                            : <IoMdPause /> }
                    </button>
                    <button onClick={nextStep}>
                        <IoMdFastforward />
                    </button>
                </div>
                <div className={styles.fileControls}>
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
            </div>
        </div>
    )
}

type StepInputProps = {
    step: CameraStep,
    setStep: (step: CameraStep) => void,
    removeStep: () => void,
    getCameraPosition: () => [number, number, number],
    getCameraFocus: () => [number, number, number],
}

const StepInput: FC<StepInputProps> = ({
    step, setStep, removeStep, getCameraPosition, getCameraFocus
}) => {
    const [currKey, setCurrKey] = useState<number>(0)

    const updateStep = (updateKey?: boolean): void => {
        // don't need object copy since steps state is copied
        // in camera menu on setStep
        setStep(step)
        if (updateKey) {
            setCurrKey(currKey + 1)
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
                <PointInput
                    point={step.position}
                    setPoint={setPosition}
                    update={(): void => setPosition(getCameraPosition(), true)}
                    clear={removeStep}
                    icon={<HiMiniVideoCamera />}
                    key={currKey}
                />
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
                    <PointInput
                        point={step.focus}
                        setPoint={setFocus}
                        update={(): void => setFocus(getCameraFocus(), true)}
                        clear={(): void => setFocus(null, true)}
                        icon={<HiEye />}
                        key={currKey + 1}
                    />
                </div>
            }
        </div>
    )
}

type PointInputProps = {
    point: [number, number, number],
    setPoint: (point: [number, number, number]) => void,
    update: () => void,
    clear: () => void,
    icon: React.ReactElement
}

const PointInput: FC<PointInputProps> = ({
    point, setPoint, update, clear, icon
}) => {
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

    return (
        <div className={styles.pointInput}>
            <button onClick={update} className={styles.icon}>
                { icon }
            </button>
            <input
                type={'text'}
                defaultValue={roundToPrecision(point[0], INPUT_PRECISION)}
                onChange={getIndSetter(0)}
            />
            <input
                type={'text'}
                defaultValue={roundToPrecision(point[1], INPUT_PRECISION)}
                onChange={getIndSetter(1)}
            />
            <input
                type={'text'}
                defaultValue={roundToPrecision(point[2], INPUT_PRECISION)}
                onChange={getIndSetter(2)}
            />
            <button onClick={clear} className={styles.icon}>
                <HiMiniXMark />
            </button>
        </div>
    )
}

const roundToPrecision = (val: number, precision: number): number => {
    const mul = Math.pow(10, precision)
    return Math.round(val * mul) / mul
}

export default CameraMenu
