import type { GalaxyData } from '../lib/data'
import type { Selection } from '../components/select-menu'

const selectionsToText = (data: GalaxyData, selections: Array<Selection>): string => {
    const { headers, entries } = data
    const nameInd = headers.strHeaders['Object Name']
    let text = ''
    for (const selection of selections) {
        // add header for selection name
        text += '--- ' + selection.name + ' ---\n'
        for (const ind of selection.inds) {
            // add each galaxy name
            text += entries[ind].strValues[nameInd] + '\n'
        }
        // new line at end of selection
        text += '\n'
    }
    return text
}

const downloadTxt = (contents: string): void => {
    const element: HTMLAnchorElement = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents))
    element.setAttribute('download', 'n3d_selections.txt')
    element.style.display = 'none'

    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

export { selectionsToText, downloadTxt }
