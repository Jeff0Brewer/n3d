import { FC } from 'react'
import type { DataHeaders } from '../lib/data'
import styles from '../styles/info.module.css'

type GalaxyInfoProps = {
    headers: DataHeaders,
    fields: Array<string>
}

const GalaxyInfo: FC<GalaxyInfoProps> = ({ headers, fields }) => {
    return (
        <div className={styles.info}>
            { Object.entries(INFO_FIELDS).map(([key, value], i) => {
                const field = fields[headers.strHeaders[value]]
                return (
                    <div className={field ? styles.wrap : styles.hidden} key={i}>
                        <p className={styles.label}>{key}</p>
                        <p>{field}</p>
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
