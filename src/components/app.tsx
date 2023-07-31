import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import GalaxyInfo from '../components/info'
import ColorMapMenu, { ColorField } from '../components/color-map'
import SelectMenu from '../components/filter'
import Vis from '../components/vis'

const App: FC = () => {
    const [data, setData] = useState<GalaxyData | null>(null)
    const [selected, setSelected] = useState <number | null>(null)
    const [selections, setSelections] = useState<Array<Array<string>>>([])
    const [colorField, setColorField] = useState<ColorField | null>(null)

    const getData = async (): Promise<void> => {
        const data = await loadData('./data/data.csv')
        setData(data)
    }

    useEffect(() => {
        getData()
    }, [])

    if (!data) { return <></> }
    return (
        <main>
            <SelectMenu data={data} />
            <ColorMapMenu data={data} colorField={colorField} setColorField={setColorField} />
            { selected && <GalaxyInfo headers={data.headers} fields={data.entries[selected]} /> }
            <Vis
                data={data}
                selected={selected}
                setSelected={setSelected}
                colorField={colorField}
            />
        </main>
    )
}

export default App
