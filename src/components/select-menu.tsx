import { FC } from 'react'
import FilterSelect from '../components/filter-select'
import type { GalaxyData } from '../lib/data'

type SelectMenuProps = {
    data: GalaxyData,
    selections: Array<Array<number>>,
    setSelections: (selections: Array<Array<number>>) => void
}

const SelectMenu: FC<SelectMenuProps> = ({ data, selections, setSelections }) => {
    const addSelection = (selection: Array<number>): void => {
        setSelections([selection, ...selections])
    }

    return (
        <div>
            <FilterSelect data={data} addSelection={addSelection} />
        </div>
    )
}

export default SelectMenu
