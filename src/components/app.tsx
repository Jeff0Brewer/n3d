import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data-load'
import type { CsvData } from '../lib/data-load'
import Vis from '../components/vis'

const App: FC = () => {
    const [data, setData] = useState<CsvData | null>(null)

    const getPositions = async (): Promise<void> => {
        const data = await loadData('./data/data.csv')
        setData(data)
    }

    useEffect(() => {
        getPositions()
    }, [])

    return (
        <main>
            { data && <Vis data={data} /> }
        </main>
    )
}

export default App
