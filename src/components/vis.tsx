import { useState, useRef, useEffect, FC } from 'react'
import type { GalaxyData, Landmark } from '../lib/data'
import type { ColorField } from '../lib/color-map'
import type { Selection } from '../components/select-menu'
import type { Sphere } from '../vis/sphere-bounds'
import type { Cone } from '../vis/cone-bounds'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type VisProps = {
    galaxyData: GalaxyData,
    landmarkData: Array<Landmark>,
    selected: number | null,
    setSelected: (ind: number | null) => void,
    colorField: ColorField | null,
    selections: Array<Selection>,
    sphere: Sphere | null,
    cone: Cone | null
}

const Vis: FC<VisProps> = ({
    galaxyData, landmarkData, selected, setSelected,
    colorField, selections, sphere, cone
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

    // init vis renderer
    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, galaxyData)
            const removeHandlers = visRef.current.setupHandlers(canvasRef.current)
            return removeHandlers
        }
    }, [galaxyData])

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
            return visRef.current.setupSelectHandlers(canvasRef.current, setSelected)
        }
    }, [galaxyData, selecting, setSelected])

    useEffect(() => {
        if (visRef.current) {
            visRef.current.setSelected(galaxyData, selected)
        }
    }, [galaxyData, selected])

    // color map on field change
    useEffect(() => {
        if (visRef.current) {
            visRef.current.colorMapField(galaxyData, colorField)
        }
    }, [galaxyData, colorField])

    // filter by selections
    useEffect(() => {
        if (visRef.current) {
            visRef.current.filterSelections(selections)
        }
    }, [selections])

    // update sphere bounds in renderer on prop change
    useEffect(() => {
        if (visRef.current) {
            visRef.current.setSphereBounds(sphere)
        }
    }, [sphere])

    // update cone bounds in renderer on prop change
    useEffect(() => {
        if (visRef.current) {
            visRef.current.setConeBounds(cone)
        }
    }, [cone])

    // update landmark draw state in renderer on state change
    useEffect(() => {
        if (visRef.current) {
            visRef.current.setDrawLandmarks(drawLandmarks)
        }
    }, [drawLandmarks])

    // start draw loop
    useEffect(() => {
        const draw = (): void => {
            if (!visRef.current) { return }
            visRef.current.draw(landmarkData)
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
        </div>
    )
}

export default Vis
