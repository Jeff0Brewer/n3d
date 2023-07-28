import { FC, useState, useEffect } from 'react'
import { colorArrToGradient } from '../lib/color-map'
import type { GalaxyData } from '../lib/data'
import styles from '../styles/color-field.module.css'

type ColorField = {
    name: string,
    min: number,
    max: number
}

type ColorMapMenuProps = {
    data: GalaxyData,
    colorField: ColorField | null,
    setColorField: (field: ColorField) => void
}

const ColorMapMenu: FC<ColorMapMenuProps> = ({ data, colorField, setColorField }) => {
    const [open, setOpen] = useState<boolean>(false)
    const [colorFields, setColorFields] = useState<Array<ColorField>>([])

    useEffect(() => {
        const { headers, entries } = data
        const colorFields: Array<ColorField> = COLOR_MAP_FIELDS.map((name: string) => {
            const fieldInd = headers[name]
            let min = Number.MAX_VALUE
            let max = Number.MIN_VALUE
            for (const entry of entries) {
                const value = parseFloat(entry[fieldInd])
                if (!Number.isNaN(value)) {
                    min = Math.min(min, value)
                    max = Math.max(max, value)
                }
            }
            return { name, min, max }
        })
        setColorFields(colorFields)
    }, [data])

    return (
        <div className={styles.wrap}>
            <a className={styles.label} onClick={(): void => setOpen(!open)}>
                <p>color map</p>
                <div
                    className={styles.gradient}
                    style={{ background: colorArrToGradient(COLOR_MAP_COLORS) }}
                ></div>
            </a>
            { open && <div className={styles.scroll}>
                { colorFields.map((field, i) =>
                    <a className={colorField?.name === field.name
                        ? styles.selected
                        : styles.field}
                    onClick={(): void => setColorField(field)}
                    key={i}
                    > {field.name} </a>
                )}
            </div> }
        </div>
    )
}

const COLOR_MAP_COLORS = ['F06857', 'ECA653', 'E8CD52', '4CD15E', '5561E7', '3E39AC', 'C447E0']

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
export type { ColorField }
export { COLOR_MAP_COLORS }
