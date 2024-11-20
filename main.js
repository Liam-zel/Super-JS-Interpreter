import _Interpreter from './sjsinterpreter/class debug.js'
// import programLineByLine from './ProgramFlow.js'

const folder = './programs/'
const defaultFile = 'typing speed test'
const extension = '.sjs'

let file = process.argv.slice(2).join(" ")
if (file === "") {
    file = defaultFile
}

let path = folder + file + extension
var I = new _Interpreter(path)
// I.showErrors(true)
// I.showRunTime(true)
// I.showPrint(true)
// I.endOnError(true)
await I.runProgram()

// I.printLinePerformance()
// I.printCounters()
// I.printVariables()
// I.printFuncPerformance()
// console.log(I.program)




// TODO: buffer keyboard inputs so they run as soon as possible
//          -   the onKeyStroke function reads keys but the program might be running
//              something and throws away the input despite it being read



// const p = new programLineByLine()
// p.setup(I)
// p.run(500)









// console.log("NEW: ")
// let t = Date.now()
// I.runProgram()
// console.log((Date.now() - t) + "ms") 

// import Interpreter from './sjsinterpreter/old class.js'
// I = new Interpreter(path)
// console.log("OLD: ")
// t = Date.now()
// I.runProgram()
// console.log((Date.now() - t) + "ms") 

// import aInterpreter from './sjsinterpreter/slightly less old class.js'
// I = new aInterpreter(path)
// console.log("LESS OLD: ")
// t = Date.now()
// I.runProgram()
// console.log((Date.now() - t) + "ms") 


/*TODO
- function arguments
- easier ways to make manual 2d arrays
- fix up inconsistencies with needing read only brackets ([]) or not
    - optimise:
        - don't make functions run themselves in a "sandbox" for return value
            - SURELY this can be done in the _return() function
        - Move into array is prolly shit
        - multithreading? 
            - a new thread for function sandboxing
            - a new thread for each step of insertVariables in string
*/