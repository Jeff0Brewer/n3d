import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import Vis from '../components/vis'

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
    headers: Array<string>,
    fields: Array<string>
}

const GalaxyInfo: FC<GalaxyInfoProps> = ({ headers, fields }) => {
    return (
        <div>
            {fields.toString()}
        </div>
    )
}

export default App
