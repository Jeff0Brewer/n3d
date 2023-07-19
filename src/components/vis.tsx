import { useState, useRef, useEffect, FC } from 'react'
import type { CsvData } from '../lib/data-load'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type VisProps = {
    data: CsvData
}

const Vis: FC<VisProps> = ({ data }) => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)
    const visRef = useRef<VisRenderer | null>(null)

    useEffect(() => {
        const onResize = (): void => {
            setWidth(window.innerWidth)
            setHeight(window.innerHeight)
        }
        window.addEventListener('resize', onResize)
        return (): void => {
            window.removeEventListener('resize', onResize)
        }
    }, [])

    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, data)
            const removeHandlers = visRef.current.setupHandlers(canvasRef.current)
            return removeHandlers
        }
    }, [data])

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
        <canvas
            className={styles.canvas}
            ref={canvasRef}
            width={width * window.devicePixelRatio}
            height={height * window.devicePixelRatio}
            style={{ width: `${width}px`, height: `${height}px` }}
        />
    )
}

export default Vis
