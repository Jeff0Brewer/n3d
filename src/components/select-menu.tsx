import React, { FC, useState } from 'react'
import { FaEye, FaBan, FaCaretRight, FaCaretLeft } from 'react-icons/fa'
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
    setSelections: (selections: Array<Selection>) => void,
    selected: number | null,
    setSelected: (ind: number | null) => void
}

const SelectMenu: FC<SelectMenuProps> = ({
    data, selections, setSelections, selected, setSelected
}) => {
    const [displaySelection, setDisplaySelection] = useState<Selection | null>(null)

    return (
        <section className={styles.selectMenu}>
            <CreateMenu
                data={data}
                selections={selections}
                setSelections={setSelections}
            />
            <ViewMenu
                selections={selections}
                setSelections={setSelections}
                displaySelection={displaySelection}
                setDisplaySelection={setDisplaySelection}
            />
            <GalaxyDisplay
                data={data}
                selection={displaySelection}
                selected={selected}
                setSelected={setSelected}
            />
        </section>
    )
}

type CreateMenuProps = {
    data: GalaxyData,
    selections: Array<Selection>,
    setSelections: (selections: Array<Selection>) => void,
}

const CreateMenu: FC<CreateMenuProps> = ({ data, selections, setSelections }) => {
    const [newSelection, setNewSelection] = useState<Selection | null>(null)
    const [selectionCount, setSelectionCount] = useState<number>(0)

    const addSelection = (): void => {
        if (newSelection) {
            setSelections([...selections, newSelection])
            setNewSelection(null)
            setSelectionCount(selectionCount + 1)
        }
    }

    return (
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
                    setSelection={setNewSelection}
                />
            </div>
            <button
                className={styles.createButton}
                onClick={addSelection}
            >create</button>
        </div>
    )
}

type ViewMenuProps = {
    selections: Array<Selection>,
    setSelections: (selections: Array<Selection>) => void,
    displaySelection: Selection | null,
    setDisplaySelection: (selection: Selection | null) => void
}

const ViewMenu: FC<ViewMenuProps> = ({
    selections, setSelections, displaySelection, setDisplaySelection
}) => {
    const setSelectionName = (ind: number): ((name: string) => void) => {
        return (name: string): void => {
            selections[ind].name = name
            setSelections([...selections])
        }
    }

    const deleteSelection = (ind: number): (() => void) => {
        return (): void => {
            // remove display menu if deleting displayed selection
            if (displaySelection?.key === selections[ind].key) {
                setDisplaySelection(null)
            }
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

    if (selections.length === 0) { return <></> }
    return (
        <div className={styles.viewMenu}>
            <p className={styles.header}>Selections</p>
            <div className={styles.selectionsList}>
                { selections.map((selection, i) =>
                    <ViewItem
                        selection={selection}
                        displaySelection={displaySelection}
                        setDisplaySelection={setDisplaySelection}
                        setName={setSelectionName(i)}
                        deleteSelection={deleteSelection(i)}
                        toggleVisibility={toggleVisiblity(i)}
                        key={selection.key}
                    />
                )}
            </div>
        </div>
    )
}

type ViewItemProps = {
    selection: Selection,
    displaySelection: Selection | null,
    setDisplaySelection: (selection: Selection | null) => void,
    setName: (name: string) => void,
    deleteSelection: () => void,
    toggleVisibility: () => void
}

const ViewItem: FC<ViewItemProps> = ({
    selection, displaySelection, setDisplaySelection,
    setName, deleteSelection, toggleVisibility
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
                <div> { displaySelection?.key !== selection.key
                    ? <a onClick={(): void => setDisplaySelection(selection)}>
                        <FaCaretRight />
                    </a>
                    : <a onClick={(): void => setDisplaySelection(null)}>
                        <FaCaretLeft />
                    </a>
                } </div>
            </div>
        </span>
    )
}

type GalaxyDisplayProps = {
    data: GalaxyData,
    selection: Selection | null,
    selected: number | null,
    setSelected: (ind: number | null) => void
}

const GalaxyDisplay: FC<GalaxyDisplayProps> = ({
    data, selection, selected, setSelected
}) => {
    const nameInd = data.headers['Object Name']

    if (!selection) { return <></> }
    return (
        <div className={styles.selectionDisplay}>
            <p className={styles.header}>{selection.name}</p>
            <div className={styles.galaxyList}>
                { selection.inds.map((ind, i) =>
                    <a
                        data-active={ind === selected}
                        onClick={(): void => setSelected(ind)}
                        key={i}
                    >
                        {data.entries[ind][nameInd]}
                    </a>
                )}
            </div>
        </div>
    )
}

export default SelectMenu
export type { Selection }
