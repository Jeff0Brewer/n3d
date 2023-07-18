import { FC, useEffect, useState } from 'react'
import { loadData } from '../lib/data-load'
import Vis from '../components/vis'

const App: FC = () => {
    const [positions, setPositions] = useState<Float32Array | null>(null)

    const getPositions = async (): Promise<void> => {
        const positions = await loadData('./data/data.csv')
        setPositions(positions)
    }

    useEffect(() => {
        getPositions()
    }, [])

    return (
        <main>
            { positions && <Vis positions={positions} /> }
        </main>
    )
}

export default App
