import { FC, useState } from 'react'
import { FaEye, FaBan, FaCaretRight } from 'react-icons/fa'
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

    const deleteSelection = (ind: number): void => {
        selections.splice(ind, 1)
        setSelections([...selections])
    }

    const toggleVisiblity = (ind: number): void => {
        selections[ind].visible = !selections[ind].visible
        setSelections([...selections])
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
            { selections.length > 0 && <div className={styles.viewMenu}>
                <p className={styles.header}>Selections</p>
                <div className={styles.selectionsList}>
                    { selections.map((selection, i) =>
                        <SelectionView
                            selection={selection}
                            deleteSelection={(): void => deleteSelection(i)}
                            toggleVisibility={(): void => toggleVisiblity(i)}
                            key={i}
                        />
                    )}
                </div>
            </div> }
        </section>
    )
}

type SelectionViewProps = {
    selection: Selection,
    deleteSelection: () => void,
    toggleVisibility: () => void
}

const SelectionView: FC<SelectionViewProps> = ({ selection, deleteSelection, toggleVisibility }) => {
    return (
        <span className={styles.selectionView}>
            <p>{selection.name}</p>
            <div className={styles.selectionViewOptions}>
                <a onClick={toggleVisibility} data-active={selection.visible}>
                    <FaEye />
                </a>
                <a onClick={deleteSelection}><FaBan /></a>
                <a> <FaCaretRight /> </a>
            </div>
        </span>
    )
}

export default SelectMenu
export type { Selection }
