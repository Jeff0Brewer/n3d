import { FC, useState } from 'react'
import styles from '../styles/color-field.module.css'

type ColorFieldSelectProps = {
    colorField: string | null,
    setColorField: (field: string | null) => void
}

const ColorFieldSelect: FC<ColorFieldSelectProps> = ({ colorField, setColorField }) => {
    const [open, setOpen] = useState<boolean>(false)

    return (
        <div className={styles.wrap}>
            <a className={styles.label} onClick={(): void => setOpen(!open)}>
                select field
            </a>
            <div className={styles.scroll}>
                { open && COLOR_MAP_FIELDS.map((field, i) =>
                    <a
                        className={colorField === field ? styles.selected : styles.field}
                        onClick={(): void => setColorField(field)}
                        key={i}
                    >
                        {field}
                    </a>
                )}
            </div>
        </div>
    )
}

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

export default ColorFieldSelect
