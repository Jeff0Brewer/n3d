import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import type { FilterOptions } from '../components/filter'
import GalaxyInfo from '../components/info'
import ColorMapMenu from '../components/color-map'
import Filter from '../components/filter'
import Vis from '../components/vis'

const App: FC = () => {
    const [data, setData] = useState<GalaxyData | null>(null)
    const [selected, setSelected] = useState <number | null>(null)
    const [colorField, setColorField] = useState<string>('2MASS  J_total')
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({})

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
            <ColorMapMenu colorField={colorField} setColorField={setColorField} />
            <Filter data={data} options={filterOptions} setOptions={setFilterOptions} />
            { selected && <GalaxyInfo headers={data.headers} fields={data.entries[selected]} /> }
            <Vis
                data={data}
                selected={selected}
                setSelected={setSelected}
                colorField={colorField}
                filterOptions={filterOptions}
            />
        </main>
    )
}

export default App
