import { useState, useRef, useEffect, FC } from 'react'
import type { GalaxyData } from '../lib/data'
import type { FilterOptions } from '../components/filter'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type VisProps = {
    data: GalaxyData,
    selected: number,
    setSelected: (ind: number | null) => void,
    colorField: string,
    filterOptions: FilterOptions
}

const Vis: FC<VisProps> = ({ data, selected, setSelected, colorField, filterOptions }) => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const [selecting, setSelecting] = useState<boolean>(false)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)
    const visRef = useRef<VisRenderer | null>(null)

    const resetCamera = (): void => {
        if (visRef.current) {
            visRef.current.camera.reset()
        }
    }

    // init vis renderer
    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, data)
            const removeHandlers = visRef.current.setupHandlers(canvasRef.current)
            return removeHandlers
        }
    }, [data])

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
    }, [selecting, data, setSelected])

    useEffect(() => {
        if (visRef.current) {
            visRef.current.setSelected(selected)
        }
    }, [selected])

    // filter on filter option
    useEffect(() => {
        if (visRef.current) {
            visRef.current.filter(data, filterOptions)
        }
    }, [data, filterOptions])

    // color map on field change
    useEffect(() => {
        if (visRef.current) {
            visRef.current.colorMapField(data, colorField)
        }
    }, [data, colorField])

    // start draw loop
    useEffect(() => {
        const draw = (): void => {
            if (!visRef.current) { return }
            visRef.current.draw()
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)
        return (): void => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [])

    return (
        <div>
            <canvas
                className={styles.canvas}
                ref={canvasRef}
                width={width * window.devicePixelRatio}
                height={height * window.devicePixelRatio}
                style={{ width: `${width}px`, height: `${height}px` }}
            />
            <a className={styles.resetCamera} onClick={resetCamera}>
                reset camera
            </a>
        </div>
    )
}

export default Vis
