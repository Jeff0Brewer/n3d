import { FC, useState, useEffect } from 'react'
import { getFieldSet } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import styles from '../styles/filter.module.css'

type FilterOptions = {
    luminosity: string | null,
    hierarchy: string | null,
    morphology: string | null,
    activity: string | null
}

type FilterValues = {
    luminosity: Array<string>,
    hierarchy: Array<string>,
    morphology: Array<string>,
    activity: Array<string>,
}

const optionMap: { [option: string]: string } = {
    luminosity: 'Luminosity Class',
    hierarchy: 'Hierarchy',
    morphology: 'Galaxy Morphology',
    activity: 'Activity Type'
}

type FilterSelectProps = {
    data: GalaxyData,
    addSelection: (selection: Array<number>) => void
}

const FilterSelect: FC<FilterSelectProps> = ({ data, addSelection }) => {
    const [options, setOptions] = useState<FilterOptions>({
        luminosity: null,
        hierarchy: null,
        morphology: null,
        activity: null
    })
    const [filterValues, setFilterValues] = useState<FilterValues>({
        luminosity: [],
        hierarchy: [],
        morphology: [],
        activity: []
    })

    useEffect(() => {
        setFilterValues({
            luminosity: getFieldSet(data, 'Luminosity Class'),
            hierarchy: getFieldSet(data, 'Hierarchy'),
            morphology: getFieldSet(data, 'Galaxy Morphology'),
            activity: getFieldSet(data, 'Activity Type')
        })
    }, [data])

    useEffect(() => {
        const { headers, entries } = data
        const selection = []
        for (const [option, value] of Object.entries(options)) {
            if (!option) { return } // don't filter on null option

            // use option map to convert field name to csv header name
            const optionInd = headers[optionMap[option]]

            for (let i = 0; i < entries.length; i++) {
                if (entries[i][optionInd] === value) {
                    selection.push(i)
                }
            }
        }
        if (selection.length > 0) {
            addSelection(selection)
        }
        // disable exhaustive deps to prevent loop on selection addition
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, options])

    const setLuminosity = (value: string | null): void => {
        options.luminosity = value
        setOptions({ ...options })
    }

    const setHierarchy = (value: string | null): void => {
        options.hierarchy = value
        setOptions({ ...options })
    }

    const setMorphology = (value: string | null): void => {
        options.morphology = value
        setOptions({ ...options })
    }

    const setActivity = (value: string | null): void => {
        options.activity = value
        setOptions({ ...options })
    }

    return (
        <div className={styles.wrap}>
            <FilterOption
                label={'Luminosity Class'}
                option={options.luminosity}
                values={filterValues.luminosity}
                setOption={setLuminosity}
            />
            <FilterOption
                label={'Hierarchy'}
                option={options.hierarchy}
                values={filterValues.hierarchy}
                setOption={setHierarchy}
            />
            <FilterOption
                label={'Morphology'}
                option={options.morphology}
                values={filterValues.morphology}
                setOption={setMorphology}
            />
            <FilterOption
                label={'Activity Type'}
                option={options.activity}
                values={filterValues.activity}
                setOption={setActivity}
            />
        </div>
    )
}

type FilterOptionProps = {
    label: string,
    option: string | null
    values: Array<string>,
    setOption: (value: string | null) => void
}

const FilterOption: FC<FilterOptionProps> = ({ label, option, values, setOption }) => {
    const [open, setOpen] = useState<boolean>(false)

    const clearField = (): void => {
        setOption(null)
        setOpen(false)
    }

    const setField = (value: string): void => {
        setOption(value)
        setOpen(false)
    }

    return (
        <div className={styles.dropdown}>
            <span>
                <a onClick={(): void => setOpen(!open)}>{label}</a>
                { option && <a
                    className={styles.reset}
                    onClick={clearField}
                >x</a> }
            </span>
            { open
                ? <div className={styles.options}>
                    { values.map((value, i) =>
                        <a
                            className={styles.option}
                            onClick={(): void => setField(value)}
                            key={i}
                        > {value} </a>
                    )}
                </div>
                : <p className={styles.selected}>{option || 'all'}</p> }
        </div>
    )
}

export default FilterSelect
