import React, { ReactElement, FC, useState } from 'react'
import { FaEye, FaBan, FaCaretRight, FaCaretLeft, FaFileDownload } from 'react-icons/fa'
import { selectionsToText, downloadTxt } from '../lib/export'
import FilterSelect from '../components/filter-select'
import SphereSelect from '../components/sphere-select'
import ConeSelect from '../components/cone-select'
import type { GalaxyData } from '../lib/data'
import type { Sphere } from '../vis/sphere-bounds'
import type { Cone } from '../vis/cone-bounds'
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
    setSelected: (ind: number | null) => void,
    hovered: number | null,
    setSphere: (sphere: Sphere | null) => void,
    setCone: (cone: Cone | null) => void
}

const SelectMenu: FC<SelectMenuProps> = ({
    data, selections, setSelections, selected,
    setSelected, hovered, setSphere, setCone
}) => {
    const [displaySelection, setDisplaySelection] = useState<Selection | null>(null)

    return (
        <section className={styles.selectMenu}>
            <CreateMenu
                data={data}
                selected={selected}
                hovered={hovered}
                selections={selections}
                setSelections={setSelections}
                setSphere={setSphere}
                setCone={setCone}
            />
            <ViewMenu
                data={data}
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

type SelectionMode = 'filter' | 'sphere' | 'cone' | null

type CreateMenuProps = {
    data: GalaxyData,
    selected: number | null,
    hovered: number | null,
    selections: Array<Selection>,
    setSelections: (selections: Array<Selection>) => void,
    setSphere: (sphere: Sphere | null) => void,
    setCone: (cone: Cone | null) => void
}

const CreateMenu: FC<CreateMenuProps> = ({
    data, selected, hovered, selections, setSelections, setSphere, setCone
}) => {
    const [selectionMode, setSelectionMode] = useState<SelectionMode>(null)
    const [selectionCount, setSelectionCount] = useState<number>(0)

    const addSelection = (selection: Selection): void => {
        setSelectionCount(selectionCount + 1)
        setSelections([...selections, selection])
        setSelectionMode(null)
        setSphere(null)
        setCone(null)
    }

    const getModeSetter = (mode: SelectionMode): (() => void) => {
        return (): void => {
            if (selectionMode === mode) {
                setSelectionMode(null)
            } else {
                setSelectionMode(mode)
            }
            // clear bounds if toggling off bound select mode
            if (mode !== 'sphere' || selectionMode === mode) { setSphere(null) }
            if (mode !== 'cone' || selectionMode === mode) { setCone(null) }
        }
    }

    const renderSelectModeMenu = (mode: SelectionMode): ReactElement => {
        switch (mode) {
            case 'filter':
                return <FilterSelect
                    data={data}
                    selectionCount={selectionCount}
                    addSelection={addSelection}
                />
            case 'sphere':
                return <SphereSelect
                    data={data}
                    selected={selected}
                    hovered={hovered}
                    selectionCount={selectionCount}
                    addSelection={addSelection}
                    setSphere={setSphere}
                />
            case 'cone':
                return <ConeSelect
                    data={data}
                    selected={selected}
                    hovered={hovered}
                    selectionCount={selectionCount}
                    addSelection={addSelection}
                    setCone={setCone}
                />
            case null:
                return <></>
        }
    }

    return (
        <div className={styles.createMenu}>
            <p className={styles.header}>Create Selection</p>
            <span className={styles.createTabs}>
                <button
                    data-active={selectionMode === 'filter'}
                    onClick={getModeSetter('filter')}
                >
                    Filter
                </button>
                <button
                    data-active={selectionMode === 'sphere'}
                    onClick={getModeSetter('sphere')}
                >
                    Sphere
                </button>
                <button
                    data-active={selectionMode === 'cone'}
                    onClick={getModeSetter('cone')}
                >
                    Cone
                </button>
            </span>
            { selectionMode !== null && <>
                { renderSelectModeMenu(selectionMode) }
            </>}
        </div>
    )
}

type ViewMenuProps = {
    data: GalaxyData,
    selections: Array<Selection>,
    setSelections: (selections: Array<Selection>) => void,
    displaySelection: Selection | null,
    setDisplaySelection: (selection: Selection | null) => void
}

const ViewMenu: FC<ViewMenuProps> = ({
    data, selections, setSelections, displaySelection, setDisplaySelection
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

    const exportSelections = (): void => {
        downloadTxt('n3d_selections.txt', selectionsToText(data, selections))
    }

    if (selections.length === 0) { return <></> }
    return (
        <div className={styles.viewMenu}>
            <div className={styles.header}>
                <p>Selections</p>
                <a
                    className={styles.exportButton}
                    onClick={exportSelections}
                ><FaFileDownload /></a>
            </div>
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
    const { headers, entries } = data
    const nameInd = headers.strHeaders['Object Name']

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
                        {entries[ind].strValues[nameInd]}
                    </a>
                )}
            </div>
        </div>
    )
}

export default SelectMenu
export type { Selection }
