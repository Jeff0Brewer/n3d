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
            <div className={styles.createMenu}>
                <p className={styles.header}>Create Selection</p>
                <span className={styles.createTabs}>
                    <button>Filter</button>
                    <button>Sphere</button>
                    <button>Cone</button>
                </span>
                <div className={styles.createTypesMenu}>
                    <FilterSelect data={data} addSelection={addSelection} />
                </div>
                <button className={styles.createButton}>create</button>
            </div>
        </section>
    )
}

export default SelectMenu
