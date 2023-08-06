import { vec3 } from 'gl-matrix'
import Papa from 'papaparse'
import type { ParseConfig } from 'papaparse'

// helper info for parsing csv with string / number fields
const entryStrInds = [0, 1, 2, 5, 7, 8, 9, 10]

type GalaxyHeaders = {
    strHeaders: { [name: string]: number },
    numHeaders: { [name: string]: number }
}

type GalaxyEntry = {
    strValues: Array<string>,
    numValues: Array<number>,
    position: vec3
}

type GalaxyData = {
    headers: GalaxyHeaders,
    entries: Array<GalaxyEntry>
}

type Landmark = {
    name: string,
    position: vec3,
    radius: number
}

type Dataset = {
    galaxies: GalaxyData,
    landmarks: Array<Landmark>
}

type SelectMap = {
    [color: string]: number
}

type SelectColors = {
    map: SelectMap,
    buffer: Uint8Array
}

const POS_SCALE = 0.012
const DEG_TO_RAD = Math.PI / 180

const csvParseConfig: ParseConfig = {
    transform: (value: string): string => value.trim()
}

const parseLandmarkData = (data: Array<Array<string>>): Array<Landmark> => {
    // get indices of required fields for access in loop
    const headerRow = data[0]
    const objTypeInd = headerRow.indexOf('Object Type')
    const nameInd = headerRow.indexOf('Object Name')
    const lngInd = headerRow.indexOf('LON')
    const latInd = headerRow.indexOf('LAT')
    const diameterInd = headerRow.indexOf('SDSS-DR6 r Isophotal 25.0 mag arcsec^-2 Major Diam')
    const distInd = headerRow.indexOf('Metric Dist.')

    const landmarks: Array<Landmark> = []
    data.filter(row => row[objTypeInd] === 'LM')
        .forEach(row => {
            const lng = parseFloat(row[lngInd]) * DEG_TO_RAD
            const lat = parseFloat(row[latInd]) * DEG_TO_RAD
            const dist = parseFloat(row[distInd]) * POS_SCALE
            const position = vec3.fromValues(
                dist * Math.sin(lng) * Math.cos(lat),
                dist * Math.cos(lng) * Math.cos(lat),
                dist * Math.sin(lat)
            )
            const diameter = parseFloat(row[diameterInd]) * POS_SCALE
            const name = row[nameInd]
            landmarks.push({
                name,
                position,
                radius: diameter * 0.5
            })
        })

    return landmarks
}

const parseGalaxyData = (data: Array<Array<string>>): GalaxyData => {
    // get header indices for number / string values
    // for indexing into galaxy entries
    const headerRow = data[0]
    const headers: GalaxyHeaders = {
        strHeaders: {},
        numHeaders: {}
    }
    let numInd = 0
    let strInd = 0
    for (let i = 0; i < headerRow.length; i++) {
        entryStrInds.indexOf(i) === -1
            ? headers.numHeaders[headerRow[i]] = numInd++
            : headers.strHeaders[headerRow[i]] = strInd++
    }
    // parse galaxy data into number / string arrays
    const entries: Array<GalaxyEntry> = []
    const objTypeInd = headerRow.indexOf('Object Type')
    data.filter(row => row[objTypeInd] === 'G')
        .forEach(row => {
            const entryInd = entries.length
            entries.push({
                strValues: [],
                numValues: [],
                position: vec3.create()
            })
            // split csv data into string / number value arrays
            row.forEach((value: string, i: number) => {
                entryStrInds.indexOf(i) === -1
                    ? entries[entryInd].numValues.push(parseFloat(value))
                    : entries[entryInd].strValues.push(value)
            })
        })
    // calculate galaxy positions and update dataset
    const galaxyData: GalaxyData = { headers, entries }
    calcGalaxyPositions(galaxyData)
    return galaxyData
}

// calculate galaxy positions from lat / lng / redshift
// modifies data object in place
const calcGalaxyPositions = (data: GalaxyData): void => {
    const { headers, entries } = data

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

const loadDataset = async (path: string): Promise<Dataset> => {
    const res = await fetch(path)
    const csvString = await res.text()
    const { data } = Papa.parse(csvString, csvParseConfig)

    const galaxies = parseGalaxyData(data)
    const landmarks = parseLandmarkData(data)
    return { galaxies, landmarks }
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
    const COLOR_INC = 4
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

export {
    loadDataset,
    getSelectColors,
    getFieldSet
}

export type {
    GalaxyHeaders,
    GalaxyEntry,
    GalaxyData,
    Landmark,
    SelectMap
}
