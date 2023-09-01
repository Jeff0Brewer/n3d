import React, { FC, useState } from 'react'
import CameraPath from '../lib/camera-path'
import type { CameraStep } from '../lib/camera-path'
import styles from '../styles/camera-menu.module.css'

type CameraMenuProps = {
    setCameraPath: (path: CameraPath | null) => void,
    getCameraPosition: () => [number, number, number]
}

const CameraMenu: FC<CameraMenuProps> = ({ setCameraPath, getCameraPosition }) => {
    const [visible, setVisible] = useState<boolean>(true)
    const [steps, setSteps] = useState<Array<CameraStep>>([])

    const getStepSetter = (ind: number): ((step: CameraStep) => void) => {
        return (step: CameraStep): void => {
            steps[ind] = step
            setSteps({ ...steps })
        }
    }

    const appendStep = (): void => {
        const step: CameraStep = {
            position: getCameraPosition(),
            focus: null
        }
        setSteps([...steps, step])
    }

    const startCameraPath = (): void => {
        if (steps.length === 0) {
            setCameraPath(null)
        } else {
            const path = new CameraPath(steps, 10000) // temp duration
            setCameraPath(path)
        }
    }

    if (!visible) { return <></> }
    return (
        <div className={styles.menu}>
            { steps.map((step: CameraStep, i: number) =>
                <StepInput step={step} setStep={getStepSetter(i)} />
            )}
            <button onClick={appendStep}>+</button>
            <button onClick={startCameraPath}>set</button>
        </div>
    )
}

type StepInputProps = {
    step: CameraStep,
    setStep: (step: CameraStep) => void
}

const StepInput: FC<StepInputProps> = ({ step, setStep }) => {
    const setPosition = (point: [number, number, number]): void => {
        step.position = point
        // don't need object copy since steps state is copied
        // in camera menu on setStep
        setStep(step)
    }

    const setFocus = (focus: [number, number, number]): void => {
        step.focus = focus
        // don't need object copy since steps state is copied
        // in camera menu on setStep
        setStep(step)
    }

    return (
        <div>
            <PointInput point={step.position} setPoint={setPosition} />
            { step.focus !== null &&
                <PointInput point={step.focus} setPoint={setFocus} />
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

    return (
        <div>
            <input
                type={'text'}
                defaultValue={point[0]}
                onChange={getIndSetter(0)}
            />
            <input
                type={'text'}
                defaultValue={point[1]}
                onChange={getIndSetter(1)}
            />
            <input
                type={'text'}
                defaultValue={point[2]}
                onChange={getIndSetter(2)}
            />
        </div>
    )
}

export default CameraMenu
