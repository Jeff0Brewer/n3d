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
    const raInd = headers.indexOf('RA')
    const dcInd = headers.indexOf('Dec')
    const rsInd = headers.indexOf('Redshift')

    const DEG_TO_RAD = Math.PI / 180
    const POS_SCALE = 0.012

    const positions = []
    for (const row of data) {
        if (row[objTypeInd] !== 'G') { continue }

        const ra = parseFloat(row[raInd]) * DEG_TO_RAD // right ascension
        const dc = parseFloat(row[dcInd]) * DEG_TO_RAD // declination
        const rs = parseFloat(row[rsInd]) // red shift

        const dist = POS_SCALE * rs * 4222 // magic number from legacy source, investigate

        positions.push(
            dist * Math.sin(ra) * Math.cos(dc),
            dist * Math.cos(ra) * Math.cos(dc),
            dist * Math.sin(dc)
        )
    }

    return new Float32Array(positions)
}

export {
    loadData
}
