import React, { FC, useState } from 'react'
import { FaEye, FaBan, FaCaretRight } from 'react-icons/fa'
import FilterSelect from '../components/filter-select'
import type { GalaxyData } from '../lib/data'
import styles from '../styles/select-menu.module.css'

type Selection = {
    name: string,
    key: number,
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

    const setSelectionName = (ind: number): ((name: string) => void) => {
        return (name: string): void => {
            selections[ind].name = name
            setSelections([...selections])
        }
    }

    const deleteSelection = (ind: number): (() => void) => {
        return (): void => {
            selections.splice(ind, 1)
            setSelections([...selections])
        }
    }

    const toggleVisiblity = (ind: number): (() => void) => {
        return (): void => {
            selections[ind].visible = !selections[ind].visible
            setSelections([...selections])
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
            { selections.length > 0 && <div className={styles.viewMenu}>
                <p className={styles.header}>Selections</p>
                <div className={styles.selectionsList}>
                    { selections.map((selection, i) =>
                        <SelectionView
                            selection={selection}
                            setName={setSelectionName(i)}
                            deleteSelection={deleteSelection(i)}
                            toggleVisibility={toggleVisiblity(i)}
                            key={selection.key}
                        />
                    )}
                </div>
            </div> }
        </section>
    )
}

type SelectionViewProps = {
    selection: Selection,
    setName: (name: string) => void,
    deleteSelection: () => void,
    toggleVisibility: () => void
}

const SelectionView: FC<SelectionViewProps> = ({
    selection, setName, deleteSelection, toggleVisibility
}) => {
    const updateName = (e: React.ChangeEvent): void => {
        if (!(e.target instanceof HTMLInputElement)) {
            return
        }
        setName(e.target.value)
    }

    return (
        <span className={styles.selectionView}>
            <input
                type={'text'}
                defaultValue={selection.name}
                onChange={updateName}
            />
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
