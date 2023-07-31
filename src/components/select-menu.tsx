import { FC } from 'react'
import FilterSelect from '../components/filter-select'
import type { GalaxyData } from '../lib/data'
import styles from '../styles/select-menu.module.css'

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
        <section className={styles.selectMenu}>
            <FilterSelect data={data} addSelection={addSelection} />
        </section>
    )
}

export default SelectMenu
