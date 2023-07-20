import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import GalaxyInfo from '../components/info'
import ColorFieldSelect from '../components/color-select'
import Filter from '../components/filter'
import Vis from '../components/vis'

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
            <Filter data={data} />
            { selected && <GalaxyInfo headers={data.headers} fields={selected} /> }
            <Vis data={data} setSelected={setSelected} colorField={colorField} />
        </main>
    )
}

export default App
