import { FC, useState } from 'react'
import FilterSelect from '../components/filter-select'
import type { GalaxyData } from '../lib/data'
import styles from '../styles/select-menu.module.css'

type Selection = {
    name: string,
    visible: boolean,
    inds: Array<number>
}

type SelectMenuProps = {
    data: GalaxyData,
    selections: Array<Selection>,
    setSelections: (selections: Array<Selection>) => void
}

const SelectMenu: FC<SelectMenuProps> = ({ data, selections, setSelections }) => {
    const [currSelection, setCurrSelection] = useState<Selection | null>(null)
    const [selectionCount, setSelectionCount] = useState<number>(0)

    const addSelection = (): void => {
        if (currSelection) {
            setSelections([...selections, currSelection])
            setCurrSelection(null)
            setSelectionCount(selectionCount + 1)
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
                    <FilterSelect
                        data={data}
                        selectionCount={selectionCount}
                        setSelection={setCurrSelection}
                    />
                </div>
                <button
                    className={styles.createButton}
                    onClick={addSelection}
                >create</button>
            </div>
            { selections.length > 0 && <div className={styles.selectionsView}>
                <p className={styles.header}>Selections</p>
            </div> }
        </section>
    )
}

export default SelectMenu
export type { Selection }
