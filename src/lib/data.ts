import Papa from 'papaparse'
import type { ParseConfig } from 'papaparse'

// helper info for parsing csv with string / number fields
const entryStrInds = [0, 1, 2, 5, 7, 8, 9, 10]

type DataHeaders = {
    strHeaders: { [name: string]: number },
    numHeaders: { [name: string]: number }
}

type DataEntry = {
    strValues: Array<string>,
    numValues: Array<number>
}

type GalaxyData = {
    headers: DataHeaders,
    entries: Array<DataEntry>
}

type SelectMap = {
    [color: string]: number
}

type SelectColors = {
    map: SelectMap,
    buffer: Uint8Array
}

const csvParseConfig: ParseConfig = {
    transform: (value: string): string => value.trim()
}

const loadData = async (path: string): Promise<GalaxyData> => {
    const res = await fetch(path)
    const csvString = await res.text()
    const { data } = Papa.parse(csvString, csvParseConfig)

    const headerRow = data[0]
    const headers: DataHeaders = {
        strHeaders: {},
        numHeaders: {}
    }
    let numInd = 0
    let strInd = 0
    // get header indices for number / string entry values
    for (let i = 0; i < headerRow.length; i++) {
        if (entryStrInds.indexOf(i) === -1) {
            headers.numHeaders[headerRow[i]] = numInd
            numInd++
        } else {
            headers.strHeaders[headerRow[i]] = strInd
            strInd++
        }
    }
    // split csv data into string / number value arrays
    const entries: Array<DataEntry> = []
    const objTypeInd = headerRow.indexOf('Object Type')
    data.filter(row => row[objTypeInd] === 'G')
        .forEach(row => {
            const entryInd = entries.length
            entries.push({ strValues: [], numValues: [] })
            row.forEach((value: string, i: number) => {
                entryStrInds.indexOf(i) === -1
                    ? entries[entryInd].numValues.push(parseFloat(value))
                    : entries[entryInd].strValues.push(value)
            })
        })

    return { headers, entries }
}

const getFieldSet = (data: GalaxyData, field: string): Array<string> => {
    const { headers, entries } = data
    const fieldInd = headers.strHeaders[field]
    if (!fieldInd) {
        throw new Error(`Field ${field} does not exit in dataset headers`)
    }

    const values = new Set<string>()
    for (const entry of entries) {
        const value = entry.strValues[fieldInd]
        if (value && typeof value === 'string') {
            values.add(value)
        }
    }
    return Array.from(values)
}

const getSelectColors = (data: GalaxyData): SelectColors => {
    const COLOR_INC = 2
    const { entries } = data
    const minBrightness = Math.floor(255 - COLOR_INC * Math.pow(entries.length, 0.333))

    const buffer = new Uint8Array(entries.length * 3)
    const map: SelectMap = {}
    let entryInd = 0
    let bufInd = 0
    for (let r = minBrightness; r < 256 && bufInd < buffer.length; r += COLOR_INC) {
        for (let g = minBrightness; g < 256 && bufInd < buffer.length; g += COLOR_INC) {
            for (let b = minBrightness; b < 256 && bufInd < buffer.length; b += COLOR_INC, entryInd++) {
                buffer[bufInd++] = r
                buffer[bufInd++] = g
                buffer[bufInd++] = b
                const hex = r.toString(16) + g.toString(16) + b.toString(16)
                map[hex] = entryInd
            }
        }
    }

    return { map, buffer }
}

const getPositions = (data: GalaxyData): Float32Array => {
    const { headers, entries } = data
    const positions = new Float32Array(entries.length * 3)
    const DEG_TO_RAD = Math.PI / 180
    const POS_SCALE = 0.012
    let ind = 0

    // get indices of required fields for easy access in loop
    const lngInd = headers.numHeaders.LON
    const latInd = headers.numHeaders.LAT
    const redInd = headers.numHeaders.Redshift
    for (const { numValues } of entries) {
        const lng = numValues[lngInd] * DEG_TO_RAD
        const lat = numValues[latInd] * DEG_TO_RAD
        const red = numValues[redInd]

        const dist = POS_SCALE * red * 4222 // magic number from legacy source, investigate

        positions[ind++] = dist * Math.sin(lng) * Math.cos(lat)
        positions[ind++] = dist * Math.cos(lng) * Math.cos(lat)
        positions[ind++] = dist * Math.sin(lat)
    }

    return positions
}

export {
    loadData,
    getPositions,
    getSelectColors,
    getFieldSet
}

export type {
    GalaxyData,
    SelectMap,
    DataHeaders,
    DataEntry
}
