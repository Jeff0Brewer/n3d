import { FC, useState, useEffect } from 'react'
import FilterSelect from '../components/filter-select'
import type { GalaxyData } from '../lib/data'
import styles from '../styles/select-menu.module.css'

type SelectMenuProps = {
    data: GalaxyData,
    selections: Array<Array<number>>,
    setSelections: (selections: Array<Array<number>>) => void
}

const SelectMenu: FC<SelectMenuProps> = ({ data, selections, setSelections }) => {
    const [currSelection, setCurrSelection] = useState<Array<number>>([])

    const addSelection = (): void => {
        if (currSelection.length) {
            setSelections([currSelection, ...selections])
            setCurrSelection([])
        }
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
                    <FilterSelect data={data} setSelection={setCurrSelection} />
                </div>
                <button
                    className={styles.createButton}
                    onClick={addSelection}
                >create</button>
            </div>
        </section>
    )
}

export default SelectMenu
