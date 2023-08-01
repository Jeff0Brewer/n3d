import { vec3 } from 'gl-matrix'
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
    numValues: Array<number>,
    position: vec3
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

    // get header indices for number / string entry values
    const headerRow = data[0]
    const headers: DataHeaders = {
        strHeaders: {},
        numHeaders: {}
    }
    let numInd = 0
    let strInd = 0
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
            entries.push({
                strValues: [],
                numValues: [],
                position: vec3.create()
            })
            row.forEach((value: string, i: number) => {
                entryStrInds.indexOf(i) === -1
                    ? entries[entryInd].numValues.push(parseFloat(value))
                    : entries[entryInd].strValues.push(value)
            })
        })

    // calculate positions and update dataset
    const galaxyData = { headers, entries }
    calcPositions(galaxyData)

    return galaxyData
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

// calculate galaxy positions from lat / lng / redshift
// modifies data object in place
const calcPositions = (data: GalaxyData): void => {
    const { headers, entries } = data
    const DEG_TO_RAD = Math.PI / 180
    const POS_SCALE = 0.012

    // get indices of required fields for easy access in loop
    const lngInd = headers.numHeaders.LON
    const latInd = headers.numHeaders.LAT
    const redInd = headers.numHeaders.Redshift
    for (const entry of entries) {
        const lng = entry.numValues[lngInd] * DEG_TO_RAD
        const lat = entry.numValues[latInd] * DEG_TO_RAD
        const red = entry.numValues[redInd]

        const dist = POS_SCALE * red * 4222 // magic number from legacy source, investigate

        vec3.copy(entry.position, [
            dist * Math.sin(lng) * Math.cos(lat),
            dist * Math.cos(lng) * Math.cos(lat),
            dist * Math.sin(lat)
        ])
    }
}

export {
    loadData,
    getSelectColors,
    getFieldSet
}

export type {
    GalaxyData,
    SelectMap,
    DataHeaders,
    DataEntry
}
