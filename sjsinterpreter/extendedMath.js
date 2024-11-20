/** 
 * eMathSJS 
*/
let seed = 1
let setSeedInc = 1

export function rand(setSeed) {
    seed += (Date.now() % 0.001911)
    seed.toString()

    if (setSeed) {
        seed = setSeed + setSeedInc
        setSeedInc++
    }

    // turn result into an array of whole numbers
    let accumulate = seed.toString().split("").filter(x => x != ".")   

    // accumulate array
    let total = 19424
    accumulate.forEach(value => {
        total *= parseInt(value) + 0.1
        total %= 11111111111111 // more digits more even distribution
    })

    let val = total + parseInt(accumulate[0])
    val /= 100

    // lol
    if (val > 1) val -= floor(val)

    return val
}

export function ceil(val) {
    val = val.toString()
    if (val.indexOf('.') != -1) {
        val = val.slice(0, val.indexOf('.'))
        val = parseFloat(val)
        if (val >= 0) val += 1
    }

    return parseFloat(val)
}

export function floor(val) {
    val = val.toString()
    if (val.indexOf('.') != -1) {
        val = val.slice(0, val.indexOf('.'))
        val = parseFloat(val)
        if (val < 0) val -= 1
    }

    return parseFloat(val)
}

export function absolute(val) {
    if (val < 0) return val * -1
    return val
}

export function round(val) {
    if (val - floor(val) < 0.5) return floor(val)
    else return ceil(val)
}

export function sin(val) {
    val *= Math.PI/180 // convert degrees to radians
    return Math.sin(val)
}

export function cos(val) {
    val *= Math.PI/180 // convert degrees to radians
    return Math.cos(val)
}

export function tan(val) {
    val *= Math.PI/180 // convert degrees to radians
    return Math.tan(val)
}