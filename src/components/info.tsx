import { FC, useRef } from 'react'
import type { DataHeaders, DataEntry } from '../lib/data'
import type { ColorField } from '../lib/color-map'
import ColorMap, { colorFloatToHex } from '../lib/color-map'
import { COLOR_MAP_COLORS } from '../components/color-map'
import styles from '../styles/info.module.css'

type GalaxyInfoProps = {
    headers: DataHeaders,
    entry: DataEntry,
    colorField: ColorField | null
}

const GalaxyInfo: FC<GalaxyInfoProps> = ({ headers, entry, colorField }) => {
    const colorMapRef = useRef<ColorMap>(new ColorMap(COLOR_MAP_COLORS))

    let color = 'transparent'
    if (colorField) {
        const value = entry.numValues[headers.numHeaders[colorField.name]]
        const { currMin: min, currMax: max } = colorField
        const per = (value - min) / (max - min)
        color = colorFloatToHex(colorMapRef.current.map(per))
    }

    return (
        <div className={styles.info}>
            <div className={styles.wrap}>
                <p className={styles.label}>name</p>
                <span>
                    <p>{entry.strValues[headers.strHeaders['Object Name']]}</p>
                    <div
                        className={styles.swatch}
                        style={{ backgroundColor: `#${color}` }}
                    ></div>
                </span>
            </div>
            { Object.entries(INFO_FIELDS).map(([key, field], i) => {
                const strVal = entry.strValues[headers.strHeaders[field]]
                const numVal = entry.numValues[headers.numHeaders[field]]
                const value = strVal || (!Number.isNaN(numVal) && numVal) || null
                return (
                    <div className={value ? styles.wrap : styles.hidden} key={i}>
                        <p className={styles.label}>{key}</p>
                        <p>{value}</p>
                    </div>
                )
            }
            )}
        </div>
    )
}

const INFO_FIELDS = {
    lng: 'LON',
    lat: 'LAT',
    redshift: 'Redshift',
    hierarchy: 'Hierarchy',
    'luminosity class': 'Luminosity Class',
    morphology: 'Galaxy Morphology',
    'activity type': 'Activity Type',
    'major diameter': 'SDSS-DR6 r Isophotal 25.0 mag arcsec^-2 Major Diam'
}

export default GalaxyInfo
