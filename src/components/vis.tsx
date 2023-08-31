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
        const draw = (time: number): void => {
            if (!visRef.current) { return }
            visRef.current.draw(landmarkData, time)
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
            </section>
        </div>
    )
}

export default Vis
