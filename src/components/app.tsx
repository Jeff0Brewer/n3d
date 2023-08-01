import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import type { Selection } from '../components/select-menu'
import GalaxyInfo from '../components/info'
import ColorMapMenu, { ColorField } from '../components/color-map'
import SelectMenu from '../components/select-menu'
import Vis from '../components/vis'

const App: FC = () => {
    const [data, setData] = useState<GalaxyData | null>(null)
    const [selected, setSelected] = useState <number | null>(null)
    const [selections, setSelections] = useState <Array<Selection>>([])
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
            <SelectMenu
                data={data}
                selections={selections}
                setSelections={setSelections}
                selected={selected}
                setSelected={setSelected}
            />
            <ColorMapMenu data={data} colorField={colorField} setColorField={setColorField} />
            { selected !== null &&
                <GalaxyInfo headers={data.headers} fields={data.entries[selected].strValues} /> }
            <Vis
                data={data}
                selected={selected}
                setSelected={setSelected}
                colorField={colorField}
                selections={selections}
            />
        </main>
    )
}

export default App
