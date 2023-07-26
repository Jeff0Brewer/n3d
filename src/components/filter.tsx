import { FC, useState, useEffect } from 'react'
import { getFieldSet } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import styles from '../styles/filter.module.css'

type FilterOptions = {
    [field: string]: null | string
}

type FilterProps = {
    data: GalaxyData,
    options: FilterOptions,
    setOptions: (options: FilterOptions) => void
}

const Filter: FC<FilterProps> = ({ data, options, setOptions }) => {
    return (
        <div className={styles.wrap}>
            { FILTER_FIELDS.map((field, i) =>
                <FilterOption
                    data={data}
                    field={field}
                    options={options}
                    setOptions={setOptions}
                    key={i}
                />
            )}
        </div>
    )
}

type FilterOptionProps = {
    data: GalaxyData,
    field: string,
    options: FilterOptions,
    setOptions: (options: FilterOptions) => void
}

const FilterOption: FC<FilterOptionProps> = ({ data, field, options, setOptions }) => {
    const [values, setValues] = useState<Array<string>>([])
    const [open, setOpen] = useState<boolean>(false)

    const clearField = (): void => {
        options[field] = null
        setOptions({ ...options })
        setOpen(false)
    }

    const setField = (value: string): void => {
        options[field] = value
        setOptions({ ...options })
        setOpen(false)
    }

    useEffect(() => {
        setValues(getFieldSet(data, field))
    }, [data, field])

    return (
        <div className={styles.dropdown}>
            <span>
                <a onClick={(): void => setOpen(!open)}>{field}</a>
                { options[field] &&
                    <a className={styles.reset} onClick={clearField}>x</a> }
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
                : <p className={styles.selected}>{options[field] || 'all'}</p> }
        </div>
    )
}

const FILTER_FIELDS = [
    'Luminosity Class',
    'Hierarchy',
    'Galaxy Morphology',
    'Activity Type'
]

export default Filter

export type {
    FilterOptions
}
