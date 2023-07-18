import Papa from 'papaparse'
import type { ParseConfig } from 'papaparse'

const csvParseConfig: ParseConfig = {
    transform: (value: string): string => value.trim()
}

const loadData = async (path: string): Promise<Float32Array> => {
    const res = await fetch(path)
    const csvString = await res.text()
    const { data } = Papa.parse(csvString, csvParseConfig)
    return getPositions(data)
}

const getPositions = (data: Array<Array<string>>): Float32Array => {
    // get indices of required fields for easy access in loop
    const headers = data[0]
    const objTypeInd = headers.indexOf('Object Type')
    const lngInd = headers.indexOf('LON')
    const latInd = headers.indexOf('LAT')
    const redInd = headers.indexOf('Redshift')

    const DEG_TO_RAD = Math.PI / 180
    const POS_SCALE = 0.012

    const positions = []
    for (const row of data) {
        if (row[objTypeInd] !== 'G') { continue }

        const lng = parseFloat(row[lngInd]) * DEG_TO_RAD
        const lat = parseFloat(row[latInd]) * DEG_TO_RAD
        const red = parseFloat(row[redInd])

        const dist = POS_SCALE * red * 4222 // magic number from legacy source, investigate

        positions.push(
            dist * Math.sin(lng) * Math.cos(lat),
            dist * Math.cos(lng) * Math.cos(lat),
            dist * Math.sin(lat)
        )
    }

    return new Float32Array(positions)
}

export {
    loadData
}
