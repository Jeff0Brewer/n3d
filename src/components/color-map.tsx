import { FC, useState, useEffect, useRef } from 'react'
import { FaCaretUp, FaCaretDown } from 'react-icons/fa'
import { colorArrToGradient, getColorField } from '../lib/color-map'
import type { GalaxyData } from '../lib/data'
import type { ColorField } from '../lib/color-map'
import styles from '../styles/color-field.module.css'

type ColorMapMenuProps = {
    data: GalaxyData,
    colorField: ColorField | null,
    setColorField: (field: ColorField) => void
}

const ColorMapMenu: FC<ColorMapMenuProps> = ({ data, colorField, setColorField }) => {
    const [open, setOpen] = useState<boolean>(false)
    const [colorFields, setColorFields] = useState<Array<ColorField>>([])
    const [min, setMin] = useState<number>(0)
    const [max, setMax] = useState<number>(1)

    const setFieldWithBounds = (field: ColorField | null, min: number, max: number): void => {
        if (!field) { return }
        const range = field.max - field.min
        setColorField({
            name: field.name,
            min: field.min,
            max: field.max,
            currMin: field.min + range * min,
            currMax: field.max - range * (1 - max)
        })
    }

    // get min / max for all fields, store results
    useEffect(() => {
        const colorFields: Array<ColorField> = COLOR_MAP_FIELDS.map((name: string) =>
            getColorField(data, name)
        )
        setColorFields(colorFields)
    }, [data])

    return (
        <div className={styles.wrap}>
            <div className={styles.label}>
                <a onClick={(): void => setOpen(!open)}>
                    <p>color map</p>
                    { open ? <FaCaretUp /> : <FaCaretDown /> }
                </a>
                <ColorBounds
                    min={min}
                    max={max}
                    setMin={setMin}
                    setMax={setMax}
                    colorField={colorField}
                    setColorField={setFieldWithBounds}
                />
            </div>
            { open && <div className={styles.scroll}>
                { colorFields.map((field, i) =>
                    <a className={colorField?.name === field.name
                        ? styles.selected
                        : styles.field}
                    onClick={(): void => setFieldWithBounds(field, min, max)}
                    key={i}
                    > {field.name} </a>
                )}
            </div> }
        </div>
    )
}

type ColorBoundsProps = {
    min: number,
    max: number,
    setMin: (min: number) => void,
    setMax: (max: number) => void,
    colorField: ColorField | null,
    setColorField: (field: ColorField | null, min: number, max: number) => void
}

const ColorBounds: FC<ColorBoundsProps> = ({ min, max, setMin, setMax, colorField, setColorField }) => {
    const [dragLeft, setDragLeft] = useState<boolean>(false)
    const [dragRight, setDragRight] = useState<boolean>(false)
    const boundsRef = useRef<HTMLDivElement>(null)
    const leftRef = useRef<HTMLAnchorElement>(null)
    const rightRef = useRef<HTMLAnchorElement>(null)

    const handleWidth = 8

    useEffect(() => {
        const left = leftRef.current
        const right = rightRef.current
        const bounds = boundsRef.current
        if (!(left && right && bounds)) { return }

        const rect = bounds.getBoundingClientRect()

        const dragLeftTrue = (): void => setDragLeft(true)
        const dragRightTrue = (): void => setDragRight(true)
        const clearDrag = (): void => {
            setDragLeft(false)
            setDragRight(false)
        }
        const drag = (e: MouseEvent): void => {
            const MIN_DIFF = 0.001
            const per = Math.max(Math.min((e.clientX - rect.left) / rect.width, 1), 0)
            if (dragLeft) {
                const newMin = Math.min(per, max - MIN_DIFF)
                setMin(newMin)
                setColorField(colorField, newMin, max)
            } else if (dragRight) {
                const newMax = Math.max(per, min + MIN_DIFF)
                setMax(newMax)
                setColorField(colorField, min, newMax)
            }
        }
        const preventBubble = (e: MouseEvent): void => {
            e.stopPropagation()
        }

        left.addEventListener('mousedown', dragLeftTrue)
        right.addEventListener('mousedown', dragRightTrue)
        bounds.addEventListener('click', preventBubble)
        window.addEventListener('mouseup', clearDrag)
        window.addEventListener('mousemove', drag)

        return (): void => {
            left.removeEventListener('mousedown', dragLeftTrue)
            right.removeEventListener('mousedown', dragRightTrue)
            bounds.removeEventListener('click', preventBubble)
            window.removeEventListener('mouseup', clearDrag)
            window.removeEventListener('mousemove', drag)
        }
    })

    return (
        <div ref={boundsRef} className={styles.bounds}>
            <div style={{
                backgroundColor: `#${MIN_COLOR}`,
                width: `${min * 100}%`
            }}></div>
            <a
                ref={leftRef}
                className={styles.handle}
                style={{ width: `${handleWidth}px` }}
            ></a>
            <div
                className={styles.gradient}
                style={{
                    background: colorArrToGradient(COLOR_MAP_COLORS),
                    width: `calc(${(max - min) * 100}% - ${2 * handleWidth}px)`
                }}
            ></div>
            <a
                ref={rightRef}
                className={styles.handle}
                style={{ width: `${handleWidth}px` }}
            ></a>
            <div style={{
                backgroundColor: `#${MAX_COLOR}`,
                width: `${(1 - max) * 100}%`
            }}></div>
        </div>
    )
}

const COLOR_MAP_COLORS = ['F06857', 'ECA653', 'E8CD52', '4CD15E', '5561E7', '3E39AC', 'C447E0']
const MIN_COLOR = COLOR_MAP_COLORS[0]
const MAX_COLOR = COLOR_MAP_COLORS[COLOR_MAP_COLORS.length - 1]

const COLOR_MAP_FIELDS = [
    'Redshift',
    'LON',
    'LAT',
    'GALAX ASC FUV AB',
    'GALEX ASCNUV AB',
    'GALEX MSC FUV AB',
    'GALEX MSC NUV AB',
    'SDSS-DR6 u  CModel AB',
    'SDSS-DR6 g CModel AB',
    'SDSS-DR6 r CModel AB',
    'SDSS-DR6 i  CModel AB',
    'SSDS -DR6 z  CModel AB',
    '2MASS  J_total',
    '2MASS  H_total',
    '2MASS  K_s_total',
    'IRAS FSC  60 micron',
    'IRAS FSC 100 micron',
    'NVSS 1.4 GHz',
    'SDSS-DR6 r Isophotal 25.0 mag arcsec^-2 Major Diam',
    'SDSS-DR6 r Isophotal 25.0 mag arcsec^-2 MinorMajorRatio',
    '2MASS K_s Isophotal  20.0 K-mag arcsec^-2 Major Diam',
    '2MASS K_s Isophotal  20.0 K-mag arcsec^-2 Minor Major Ratio',
    'Metric Dist.',
    'Hubble Distance',
    'D_Metric-D_Hubble',
    'Ks Physical Diameter',
    'FUV-NUV',
    'u-g',
    'g-r',
    'r-i',
    'i-z',
    'J-H',
    'H-Ks',
    'J-Ks',
    'S60/S100',
    'FIR',
    'LFIR',
    'S1.4GHz',
    'NUV-J',
    'q',
    'M_NUV',
    'M_J',
    'M_H',
    'M_Ks'
]

export default ColorMapMenu
export { COLOR_MAP_COLORS }
