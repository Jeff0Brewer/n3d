import Papa from 'papaparse'
import type { ParseConfig } from 'papaparse'

type DataHeaders = {
    [name: string]: number
}

type GalaxyData = {
    headers: DataHeaders,
    entries: Array<Array<string>>
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
    const headers: DataHeaders = {}
    for (let i = 0; i < headerRow.length; i++) {
        headers[headerRow[i]] = i
    }
    const objTypeInd = headers['Object Type']
    const entries = data.filter(row => row[objTypeInd] === 'G')

    return { headers, entries }
}

const getFieldSet = (data: GalaxyData, field: string): Array<string> => {
    const { headers, entries } = data
    const fieldInd = headers[field]
    if (!fieldInd) {
        throw new Error(`Field ${field} does not exit in dataset headers`)
    }

    const values = new Set<string>()
    for (const entry of entries) {
        const value = entry[fieldInd]
        if (value) {
            values.add(value)
        }
    }
    return Array.from(values)
}

const getSelectColors = (data: GalaxyData): SelectColors => {
    const { entries } = data
    const minBrightness = Math.floor(255 - Math.pow(entries.length, 0.333))

    const buffer = new Uint8Array(entries.length * 3)
    const map: SelectMap = {}
    let entryInd = 0
    let bufInd = 0
    for (let r = minBrightness; r < 256 && bufInd < buffer.length; r++) {
        for (let g = minBrightness; g < 256 && bufInd < buffer.length; g++) {
            for (let b = minBrightness; b < 256 && bufInd < buffer.length; b++, entryInd++) {
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
    // get indices of required fields for easy access in loop
    const objTypeInd = headers['Object Type']
    const lngInd = headers.LON
    const latInd = headers.LAT
    const redInd = headers.Redshift

    const DEG_TO_RAD = Math.PI / 180
    const POS_SCALE = 0.012

    let ind = 0
    const positions = new Float32Array(entries.length * 3)
    for (const row of entries) {
        if (row[objTypeInd] !== 'G') { continue }

        const lng = parseFloat(row[lngInd]) * DEG_TO_RAD
        const lat = parseFloat(row[latInd]) * DEG_TO_RAD
        const red = parseFloat(row[redInd])

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
    DataHeaders
}
