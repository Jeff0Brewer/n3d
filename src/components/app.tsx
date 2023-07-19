import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data'
import type { GalaxyData, DataHeaders } from '../lib/data'
import Vis from '../components/vis'
import styles from '../styles/app.module.css'

const App: FC = () => {
    const [data, setData] = useState<GalaxyData | null>(null)
    const [selected, setSelected] = useState <Array<string> | null>(null)

    const getPositions = async (): Promise<void> => {
        const data = await loadData('./data/data.csv')
        setData(data)
    }

    useEffect(() => {
        getPositions()
    }, [])

    return (
        <main>
            { data && selected && <GalaxyInfo headers={data.headers} fields={selected} /> }
            { data && <Vis data={data} setSelected={setSelected} /> }
        </main>
    )
}

type GalaxyInfoProps = {
    headers: DataHeaders,
    fields: Array<string>
}

const GalaxyInfo: FC<GalaxyInfoProps> = ({ headers, fields }) => {
    const infoFields = {
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
    return (
        <div className={styles.info}>
            { Object.entries(infoFields).map(([key, value], i) => {
                const field = fields[headers[value]]
                if (field) {
                    return <div className={styles.wrap} key={i}>
                        <p className={styles.label}>{key}</p>
                        <p>{field}</p>
                    </div>
                }
                return <></>
            })}
        </div>
    )
}

export default App
