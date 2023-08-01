import { FC } from 'react'
import type { DataHeaders, DataEntry } from '../lib/data'
import styles from '../styles/info.module.css'

type GalaxyInfoProps = {
    headers: DataHeaders,
    entry: DataEntry
}

const GalaxyInfo: FC<GalaxyInfoProps> = ({ headers, entry }) => {
    return (
        <div className={styles.info}>
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
    name: 'Object Name',
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
