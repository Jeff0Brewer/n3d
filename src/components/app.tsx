import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import GalaxyInfo from '../components/info'
import Vis from '../components/vis'
import styles from '../styles/color-field.module.css'

const App: FC = () => {
    const [data, setData] = useState<GalaxyData | null>(null)
    const [selected, setSelected] = useState <Array<string> | null>(null)
    const [colorField, setColorField] = useState<string | null>(null)

    const getPositions = async (): Promise<void> => {
        const data = await loadData('./data/data.csv')
        setData(data)
    }

    useEffect(() => {
        getPositions()
    }, [])

    if (!data) { return <></> }
    return (
        <main>
            <ColorFieldSelect colorField={colorField} setColorField={setColorField} />
            { selected && <GalaxyInfo headers={data.headers} fields={selected} /> }
            <Vis data={data} setSelected={setSelected} colorField={colorField} />
        </main>
    )
}

const COLOR_MAP_FIELDS = [
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

type ColorFieldSelectProps = {
    colorField: string | null,
    setColorField: (field: string | null) => void
}

const ColorFieldSelect: FC<ColorFieldSelectProps> = ({ colorField, setColorField }) => {
    return (
        <div className={styles.wrap}>
            <p className={styles.label}>select field</p>
            <div className={styles.scroll}>
                { COLOR_MAP_FIELDS.map((field, i) =>
                    <a
                        className={styles.field}
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

export default App
