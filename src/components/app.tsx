import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data'
import { getColorField } from '../lib/color-map'
import type { GalaxyData } from '../lib/data'
import type { Selection } from '../components/select-menu'
import type { ColorField } from '../lib/color-map'
import type { Sphere } from '../vis/sphere-bounds'
import type { Cone } from '../vis/cone-bounds'
import GalaxyInfo from '../components/info'
import ColorMapMenu from '../components/color-map'
import SelectMenu from '../components/select-menu'
import Vis from '../components/vis'

const App: FC = () => {
    const [data, setData] = useState<GalaxyData | null>(null)
    const [selected, setSelected] = useState <number | null>(null)
    const [selections, setSelections] = useState <Array<Selection>>([])
    const [colorField, setColorField] = useState<ColorField | null>(null)
    const [sphere, setSphere] = useState<Sphere | null>(null)
    const [cone, setCone] = useState<Cone | null>(null)

    const getData = async (): Promise<void> => {
        const data = await loadData('./data/data.csv')
        setData(data)

        // update default color field once data loaded
        setColorField(getColorField(data, '2MASS  K_s_total'))
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
                setSphere={setSphere}
                setCone={setCone}
            />
            <ColorMapMenu data={data} colorField={colorField} setColorField={setColorField} />
            { selected !== null &&
                <GalaxyInfo
                    headers={data.headers}
                    entry={data.entries[selected]}
                    colorField={colorField}
                /> }
            <Vis
                data={data}
                selected={selected}
                setSelected={setSelected}
                colorField={colorField}
                selections={selections}
                sphere={sphere}
                cone={cone}
            />
        </main>
    )
}

export default App
