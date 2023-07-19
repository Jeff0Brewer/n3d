import Papa from 'papaparse'
import type { ParseConfig } from 'papaparse'

type GalaxyData = {
    headers: Array<string>,
    entries: Array<Array<string>>
}

type SelectMap = {
    [color: string]: string
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

    const headers = data[0]
    const objTypeInd = headers.indexOf('Object Type')
    const entries = data.filter(row => row[objTypeInd] === 'G')

    return { headers, entries }
}

const getSelectColors = (data: GalaxyData): SelectColors => {
    const { headers, entries } = data
    const nameInd = headers.indexOf('Object Name')
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
                map[hex] = entries[entryInd][nameInd]
            }
        }
    }

    return { map, buffer }
}

const getPositions = (data: GalaxyData): Float32Array => {
    const { headers, entries } = data
    // get indices of required fields for easy access in loop
    const objTypeInd = headers.indexOf('Object Type')
    const lngInd = headers.indexOf('LON')
    const latInd = headers.indexOf('LAT')
    const redInd = headers.indexOf('Redshift')

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
    getSelectColors
}

export type {
    GalaxyData,
    SelectMap
}