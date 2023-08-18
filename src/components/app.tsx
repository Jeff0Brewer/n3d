import { FC, useEffect, useState } from 'react'
import { loadDataset } from '../lib/data'
import { getColorField } from '../lib/color-map'
import type { GalaxyData, Landmark } from '../lib/data'
import type { Selection } from '../components/select-menu'
import type { ColorField } from '../lib/color-map'
import type { Sphere } from '../vis/sphere-bounds'
import type { Cone } from '../vis/cone-bounds'
import GalaxyInfo from '../components/info'
import ColorMapMenu from '../components/color-map'
import SelectMenu from '../components/select-menu'
import Vis from '../components/vis'

const App: FC = () => {
    const [galaxyData, setGalaxyData] = useState<GalaxyData | null>(null)
    const [landmarkData, setLandmarkData] = useState<Array<Landmark>>([])
    const [hovered, setHovered] = useState<number | null>(null)
    const [selected, setSelected] = useState <number | null>(null)
    const [selections, setSelections] = useState <Array<Selection>>([])
    const [colorField, setColorField] = useState<ColorField | null>(null)
    const [sphere, setSphere] = useState<Sphere | null>(null)
    const [cone, setCone] = useState<Cone | null>(null)

    const getData = async (): Promise<void> => {
        const { galaxies, landmarks } = await loadDataset('./data/data.csv')
        setGalaxyData(galaxies)
        setLandmarkData(landmarks)

        // update default color field once data loaded
        setColorField(getColorField(galaxies, '2MASS  K_s_total'))
    }

    useEffect(() => {
        getData()
    }, [])

    if (!galaxyData) { return <></> }
    return (
        <main>
            <SelectMenu
                data={galaxyData}
                selections={selections}
                setSelections={setSelections}
                selected={selected}
                setSelected={setSelected}
                hovered={hovered}
                setSphere={setSphere}
                setCone={setCone}
            />
            <ColorMapMenu
                data={galaxyData}
                colorField={colorField}
                setColorField={setColorField}
            />
            { selected !== null &&
                <GalaxyInfo
                    headers={galaxyData.headers}
                    entry={galaxyData.entries[selected]}
                    colorField={colorField}
                /> }
            <Vis
                galaxyData={galaxyData}
                landmarkData={landmarkData}
                selected={selected}
                setSelected={setSelected}
                setHovered={setHovered}
                colorField={colorField}
                selections={selections}
                sphere={sphere}
                cone={cone}
            />
        </main>
    )
}

export default App
