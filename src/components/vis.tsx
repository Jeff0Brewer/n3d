import { useState, useRef, useEffect, FC } from 'react'
import type { GalaxyData, Landmark } from '../lib/data'
import type { ColorField } from '../lib/color-map'
import type { Selection } from '../components/select-menu'
import type { Sphere } from '../vis/sphere-bounds'
import type { Cone } from '../vis/cone-bounds'
import CameraMenu from '../components/camera-menu'
import CameraPath from '../lib/camera-path'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type VisProps = {
    galaxyData: GalaxyData,
    landmarkData: Array<Landmark>,
    selected: number | null,
    setSelected: (ind: number | null) => void,
    setHovered: (ind: number | null) => void,
    colorField: ColorField | null,
    selections: Array<Selection>,
    sphere: Sphere | null,
    cone: Cone | null
}

const Vis: FC<VisProps> = ({
    galaxyData, landmarkData, selected, setSelected,
    setHovered, colorField, selections, sphere, cone
}) => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const [selecting, setSelecting] = useState<boolean>(false)
    const [drawLandmarks, setDrawLandmarks] = useState<boolean>(true)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)
    const visRef = useRef<VisRenderer | null>(null)

    const resetCamera = (): void => {
        if (visRef.current) {
            visRef.current.resetCamera(galaxyData)
            setSelected(null)
        }
    }

    const setDrawCameraPath = (draw: boolean): void => {
        if (visRef.current) {
            visRef.current.setDrawCameraPath(draw)
        }
    }

    const setCameraPath = (path: CameraPath | null): void => {
        if (visRef.current) {
            visRef.current.setCameraPath(path)
        }
    }

    const setTracePath = (path: CameraPath | null): void => {
        if (visRef.current) {
            visRef.current.setTracePath(path)
        }
    }

    const setTraceAxisPosition = (pos: [number, number, number] | null): void => {
        if (visRef.current) {
            visRef.current.setAxisPosition(pos)
        }
    }

    const getCameraPosition = (): [number, number, number] => {
        if (!visRef.current) {
            throw new Error('Cannot get camera position before vis initialization')
        }
        const position = visRef.current.camera.eye
        return [position[0], position[1], position[2]]
    }

    const getCameraFocus = (): [number, number, number] => {
        if (!visRef.current) {
            throw new Error('Cannot get camera focus before vis initialization')
        }
        const focus = visRef.current.camera.focus
        return [focus[0], focus[1], focus[2]]
    }

    // init vis renderer
    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, galaxyData, landmarkData)
            const removeHandlers = visRef.current.setupHandlers(canvasRef.current)
            return removeHandlers
        }
    }, [galaxyData, landmarkData])

    // setup event handlers
    useEffect(() => {
        const onResize = (): void => {
            setWidth(window.innerWidth)
            setHeight(window.innerHeight)
        }
        const onKey = (e: KeyboardEvent): void => {
            setSelecting(e.shiftKey)
        }
        window.addEventListener('resize', onResize)
        window.addEventListener('keydown', onKey)
        window.addEventListener('keyup', onKey)
        return (): void => {
            window.removeEventListener('resize', onResize)
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('keyup', onKey)
        }
    }, [])

    // setup selection
    useEffect(() => {
        if (!canvasRef.current || !visRef.current) { return }

        visRef.current.setSelectMode(selecting)
        if (selecting) {
            // add select handlers if selecting
            return visRef.current.setupSelectHandlers(
                canvasRef.current,
                setSelected,
                setHovered
            )
        } else {
            // clear hovered state on exit select mode
            setHovered(null)
        }
    }, [galaxyData, selecting, setSelected, setHovered])

    useEffect(() => {
        if (visRef.current) {
            visRef.current.setSelected(galaxyData, selected)
        }
    }, [galaxyData, selected])

    useEffect(() => {
        if (visRef.current) {
            visRef.current.colorMapField(galaxyData, colorField)
        }
    }, [galaxyData, colorField])

    useEffect(() => {
        if (visRef.current) {
            visRef.current.filterSelections(selections)
        }
    }, [selections])

    useEffect(() => {
        if (visRef.current) {
            visRef.current.setSphereBounds(sphere)
        }
    }, [sphere])

    useEffect(() => {
        if (visRef.current) {
            visRef.current.setConeBounds(cone)
        }
    }, [cone])

    useEffect(() => {
        if (visRef.current) {
            visRef.current.setDrawLandmarks(drawLandmarks)
        }
    }, [drawLandmarks])

    // start draw loop
    useEffect(() => {
        let lastT = Date.now()
        const draw = (): void => {
            if (!visRef.current) { return }

            const currT = Date.now()
            const elapsed = currT - lastT
            lastT = currT

            visRef.current.draw(landmarkData, elapsed)
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)
        return (): void => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [landmarkData])

    return (
        <div>
            <canvas
                className={styles.canvas}
                ref={canvasRef}
                width={width * window.devicePixelRatio}
                height={height * window.devicePixelRatio}
                style={{ width: `${width}px`, height: `${height}px` }}
            />
            <section className={styles.menu}>
                <span className={styles.controls}>
                    <button onClick={(): void => setDrawLandmarks(!drawLandmarks)}>
                        { drawLandmarks
                            ? 'hide landmarks'
                            : 'draw landmarks'}
                    </button>
                    <button onClick={resetCamera}>
                        reset camera
                    </button>
                </span>
                <CameraMenu
                    setCameraPath={setCameraPath}
                    setTracePath={setTracePath}
                    setAxisPosition={setTraceAxisPosition}
                    getCameraPosition={getCameraPosition}
                    getCameraFocus={getCameraFocus}
                    setDrawCameraPath={setDrawCameraPath}
                />
            </section>
        </div>
    )
}

export default Vis
