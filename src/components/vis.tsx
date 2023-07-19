import { useState, useRef, useEffect, FC } from 'react'
import type { GalaxyData } from '../lib/data'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type VisProps = {
    data: GalaxyData,
    setSelected: (fields: Array<string>) => void

}

const Vis: FC<VisProps> = ({ data, setSelected }) => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const [selecting, setSelecting] = useState<boolean>(false)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)
    const visRef = useRef<VisRenderer | null>(null)

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

    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, data)
            const removeHandlers = visRef.current.setupHandlers(canvasRef.current)
            return removeHandlers
        }
    }, [data])

    useEffect(() => {
        if (!canvasRef.current || !visRef.current) { return }
        visRef.current.setSelectMode(selecting)

        if (selecting) {
            return visRef.current.setupSelectHandlers(
                canvasRef.current,
                data,
                setSelected
            )
        }
    }, [selecting, data, setSelected])

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
