import { FC, useState, useEffect } from 'react'
import { getFieldSet } from '../lib/data'
import type { GalaxyData } from '../lib/data'
import styles from '../styles/filter.module.css'

type FilterProps = {
    data: GalaxyData
}

const Filter: FC<FilterProps> = ({ data }) => {
    return (
        <div className={styles.wrap}>
            { FILTER_FIELDS.map((field, i) =>
                <FilterOption data={data} field={field} key={i} />
            )}
        </div>
    )
}

type FilterOptionProps = {
    data: GalaxyData,
    field: string
}

const FilterOption: FC<FilterOptionProps> = ({ data, field }) => {
    const [options, setOptions] = useState<Array<string>>([])
    const [selected, setSelected] = useState<string | null>(null)
    const [open, setOpen] = useState<boolean>(false)

    useEffect(() => {
        setOptions(getFieldSet(data, field))
    }, [data, field])

    return (
        <div className={styles.dropdown}>
            <span>
                <a onClick={(): void => setOpen(!open)}>{field}</a>
                { selected &&
                    <a className={styles.reset} onClick={(): void => setSelected(null)}>x</a> }
            </span>
            { open
                ? <div className={styles.options}>
                    { options.map((option, i) =>
                        <a
                            className={styles.option}
                            onClick={(): void => {
                                setSelected(option)
                                setOpen(false)
                            }}
                            key={i}
                        >
                            {option}
                        </a>
                    )}
                </div>
                : <p className={styles.selected}>{selected || 'all'}</p> }
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
