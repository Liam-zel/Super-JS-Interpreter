import { readFileSync } from 'fs'
import { round, floor, ceil, rand, absolute, sin, cos, tan } from './extendedMath.js'
import { style } from './console styling.js'

import sleep from 'await-sleep'

class Counter {
    constructor(name) {
        this.name = name
        this.timesCalled = 0
        this.timeElapsed = 0
    }
}

const counters = {
    IL: new Counter("interpret line"),
    CB: new Counter("complete brackets"),
    GS: new Counter("get scope"),
    CV: new Counter("create variable"),
    CA: new Counter("create array"),
    SM: new Counter("solve math"),
    PE: new Counter("perform emath"),
    RL: new Counter("resolve logic"),
    CO: new Counter("complete operations"),
    CON: new Counter("concatenate"),
    PR: new Counter("print"),
    RF: new Counter("run function"),
    AL: new Counter("array length"), 
    MIA: new Counter("move into array"), 
    DEL: new Counter("delete"),
    IVIS: new Counter("insert variables in string"),
    GAI: new Counter("get array indexes"),
    GAAI: new Counter("get array at index"),
    CISIN: new Counter("check if string is number"),
    LR: new Counter("lines ran"),
    FS: new Counter("function sandboxing"),
    SET: new Counter("set"),
    JOIN: new Counter("join")
}

const lines = new Map()



/**
 * Shitty JavaScript (sjs) Interpreter class
 */
export default class Interpreter {   



    // _________________________ OBJECT _________________________



    /**
     * @param {path} filepath the relative filepath to the executing file
     */
    constructor(filepath) {
        this.program = this.getProgram(filepath)

        // script variables & arrays
        this.variables = new Map()
        this.arrays = new Map()

        this.primitives   = ["num", "str"]
        this.arrayTag     = "arr"

        this.math         = ["add", "sub", "mul", "div", "mod", "pow"]
        this.eMath        = ["rnd", "flr", "cel", "ran", "abs", "sin", "cos", "tan"] 
        this.operations   = ["com", "prn", "brk", "con", "clr", 
                             "ext", "col", "run", "mov", "len", "del", 
                             "time", "set", "join", "wait", 
                             "inp", "inpType", "utf", "hex"] 

        this.logic        = ["equ", "neq", "lst", "grt", "lte", "gte", "not", "or", "and"]
        this.comment      =  "*"
        this.loops        = ["lop", "for", "rep", "whl"]

        // used for multiple line instructions  e.g
        // span
        // arr x = 
        // 1,2,3,
        // 4,5,6,
        // span
        this.span = "span"
        
        this.funcOperator = "fnc"
        this.storedFunctions = new Map()
        // functions are hooked to the top of the script, so by incrementing
        // this counter, the lines can be skipped at the start of the script
        this.functionLines = 0
        // temporary line indexes stored in this path so the interpreter can backtrack 
        // after a function ends
        this.functionPath = []
        this.funcReturn = "rtn"

        // Map to store label of active benchmarkers
        this.benchmarkers = new Map()


        // console colours which can be set
        this.textStyling = style.reset
        this.backgroundStyling = style.reset
        this.isBold = false

        this.inputLine
        this.hasInput = false

        // while true, the program runs, otherwise, exit program
        this.running = true

        // when false, no sjs errors will be printed
        this.showErrorsFlag = true
        this.showRunTimeFlag = true
        this.showPrintFlag = true
        this.endOnErrorFlag = false
        // run time of sjs program
        this.runTime = 0 


        // this.mathOperations = {
        //     add: (val1, val2) => {return val1 + val2},
        //     sub: (val1, val2) => {return val1 - val2},
        //     mul: (val1, val2) => {return val1 * val2},
        //     div: (val1, val2) => {return val1 / val2},
        //     mod: (val1, val2) => {return val1 % val2},
        //     pow: (val1, val2) => {return Math.pow(val1, val2)},
        // }


        this.constants = new Map()
            this.constants.set("TAB", "\t")
            this.constants.set("NEWLINE", "\n")
            this.constants.set("NEWSEGMENT", "\n\n\n\n")
            this.constants.set("SPACE", "\u0020")
            this.constants.set("NULL", 0)
            this.constants.set("JSNULL", null)
            this.constants.set("NAN", NaN)
            this.constants.set("UNDEFINED", undefined)
            this.constants.set("INFINITY", Infinity)
            this.constants.set("PI", Math.PI)
            this.constants.set("EMPTYCHAR", "")


        this.scopeStart   = "{" 
        this.scopeEnd     = "}"
        this.scopeFlag    = "@@"
        this.scopeDepth   = 0

        // this.arrIndexFlag = ":"

        this.readStart    = "["
        this.readEnd      = "]"

        this.endOfLoopFlag = "endLoop"
        this.operations = this.operations.concat(this.endOfLoopFlag, this.funcReturn)

        this.currentLine = 0


        // when compare statements are false or loops need 
        // to be broken out of etc, the runProgram() function
        // doesnt execute the next skipLines amount of lines
        this.skipLines = 0 

        // reserved keywords, variables and functions etc. cant be named these
        this.reserved = this.primitives.concat(this.math, this.eMath, this.operations,
                                               this.logic, this.comment, this.scopeStart,
                                               this.scopeEnd, this.scopeFlag, this.readStart,
                                               this.readEnd, this.endOfLoopFlag, this.funcOperator, 
                                               this.funcReturn, ":")

        for (let element of this.constants) {
            this.reserved = this.reserved.concat(element[0])
        }
    }




    // _________________________ PROGRAM INITIALISATION _________________________



    /**
     * @param {File} filepath the filepath of the file
     */
    getProgram(filepath) {
        return readFileSync(filepath, 'utf-8')
    }

    /**
     * turns the text file into an array of strings to be read by the interpreter.
     * Also removes comments, unecessary whitespace and adds scope flags
     * @var {String} lineValues
     * @returns Array of individual lines filtering out whitespace and comments
     */
    programCast() {

        // split each line into a seperate string in an array, 
        let lineValues = this.program.split("\n")
        
        // remove comments and trims whitespace
        for (let i = 0; i < lineValues.length; i++) {
            let line = lineValues[i]
            let commentPos = (line.indexOf(this.comment) > -1) ? line.indexOf(this.comment) : line.length
            let finalLine = line.slice(0, commentPos)
            
            lineValues[i] = finalLine.trim()
            if (lineValues[i].startsWith("inp")) this.hasInput = true
        }
        
        // remove empty lines
        lineValues = lineValues.filter(line => line.trim().length > 0)
        

        // add labels to scope starts and ends
        for (let i = 0; i < lineValues.length; i++) {
            if (lineValues[i].endsWith(this.scopeStart)) {
                lineValues[i] += this.scopeFlag + this.scopeDepth
                this.scopeDepth++
            }
            if (lineValues[i].startsWith(this.scopeEnd)) {
                this.scopeDepth--
                lineValues[i] += this.scopeFlag + this.scopeDepth
            }
        }

        // combine spans
        for (let i = 0; i < lineValues.length; i++) {
            if (lineValues[i] == this.span) {
                let start = i
                let end = lineValues.indexOf(this.span, start+1)
                
                if (end === -1) break;

                let spanLine = lineValues.slice(start+1, end)
                spanLine = spanLine.join(' ')
 
                let deleteCount = end + 1 - start
                // I wasted hours upon hours over days because I thought
                // the second argument to splice was the end index
                // and not the delete count, please don't make this mistake again
                lineValues.splice(start, deleteCount, spanLine)
            }
        }

        // break apart loops 
        let depth = 0
        for (let i = lineValues.length-1; i >= 0; i--) {
            // add labels to breaks
            if (lineValues[i].startsWith('brk')) {
                lineValues[i] += " " + this.scopeFlag + (depth-1)
            }

            let line = lineValues[i]
            // keep up to date with current depth level to use for inserted comparisons and breaks
            let checkDepth = line.split(" ")

            // get last string in line and slice off the { or }
            checkDepth = checkDepth[checkDepth.length-1].slice(1)

            // if it has the scope flag, chop it off and update depth with the number at the end
            if (checkDepth.indexOf(this.scopeFlag) !== -1) depth = parseInt(checkDepth.slice(this.scopeFlag.length))

            if (this.loops.includes(line.split(" ")[0])) {
                // step 1, prepare to move variable initialisation outside loop
                let params = line.split(" ").filter(element => element != "").join(" ")
                params = params.slice(params.indexOf('(') + 1)

                params = params.split(",")
                
                // not enough parameters
                if (params.length !== 3) {
                    const errObj = { params: params }
                    return this.error("Not enough loop parameters provided!, make sure you've given a variable, a logic operation and an incrementor", errObj)
                }

                let loopVar = params[0].trim()

                // step 2, logic
                let logic = params[1].trim()
                let comp = logic.split(" ",1)[0]
                switch (comp) {
                    case "lst":
                        logic = logic.replace(comp, "gte")
                        break;
                    case "grt":
                        logic = logic.replace(comp, "lte")
                        break;
                    case "lte":
                        logic = logic.replace(comp, "gte")
                        break;
                    case "gte":
                        logic = logic.replace(comp, "lte")
                        break;
                    case "neq":
                        logic = logic.replace(comp, "equ")
                        break;
                    case "equ":
                        logic = logic.replace(comp, "neq")
                        break;
                    case "not":
                        logic = logic.replace(comp, "")
                        break;
                }


                // step 3, increment
                let increment = params[2].trim()
                increment = increment.slice(0, increment.indexOf(')'))
                increment = this.balanceBrackets(increment)


                // get rid of parameters from loop
                let newLoop = line.slice(0, 3) + " " + line.slice(line.indexOf(this.scopeStart))
                lineValues[i] = newLoop

                // place variable before loop
                lineValues.splice(i, 0, loopVar)

                 // place comparison at the start of the (HARD CODED BABY)
                let label = this.scopeFlag + (depth+1)
                let newComparison1 = "com (" + logic + ") " + this.scopeStart + label
                let newComparison2 = "brk " + this.scopeFlag + depth
                let newComparison3 = this.scopeEnd + label

                lineValues.splice(i+2, 0, newComparison1, newComparison2, newComparison3)

                // final step: place endOfLoopFlag and incrementer at end
                let finish = this.scopeEnd + this.scopeFlag + depth
        
                // find end
                for (let j = i; j < lineValues.length; j++) {
                    let line = lineValues[j]

                    // end is found, now insert flag and incrementer
                    if (line === finish) {
                        lineValues.splice(j, 0, this.endOfLoopFlag + " " + (j-i))
                        lineValues.splice(j, 0, increment)
                        break;
                    }// nice amount of nesting :)))
                }
            }
        }

        // initialise functions
        for (let i = 0; i < lineValues.length; i++) { 
            // check if 'fnc' is at the start of a line, if not, loop again
            let line = lineValues[i].split(" ")
            if (!this.funcOperator.includes(line[0])) {
                continue // first time ive EVER used continue, but I hate nesting
                // i began to use continue more often lol :)
            }

            // error handling for not using space (sends function into infinite loop)
            if (line[1].indexOf(this.scopeStart) !== -1) {
                line[2] = this.scopeStart + line[1].split(this.scopeStart)[1]
                line[1] = line[1].split(this.scopeStart)[0]
            }

            let label = line[line.length-1].slice(1)
            let start = i
            let end = lineValues.indexOf(this.scopeEnd + label, start)
            let length = end - start + 1

            // insert end of function flag before the }
            lineValues.splice(start + length - 1, 0, this.funcReturn)

            // + 2 to account for endOfFunctionFlag and }
            end += 2

            // hook functions to top of script
            // step 1: clone function
            let funcTemp = []
            for (let j = start; j < end; j++) {
                funcTemp.push(lineValues[j])
            }

            // step 2: remove function from array
            lineValues.splice(start, length+1)

            // step 3: hook function to top of script
            lineValues = funcTemp.concat(lineValues) // cool method i guess

            // step 4: offset other function indexes
            for (let [name, data] of this.storedFunctions) {
                data.index += length + 1
                this.storedFunctions.set(name, data)
            }

            let name = line[1]

            let funcData = {
                index: 1,
                returnValue: undefined
            }
            this.storedFunctions.set(name, funcData)
            this.functionLines += length + 1

            i += length
        }

        return lineValues
    }
    

        /** 
     * Sets wether sjs errors are printed when they occur.
     * @param {boolean} showErrors default: True
     */
        showErrors(arg) {
            this.showErrorsFlag = arg
        }
        
        /**
         * Sets wether to show the entire runtime of the program measured in ms after execution has ended.
         * @param {boolean} showRunTime default: True
         */ 
        showRunTime(arg) {
            this.showRunTimeFlag = arg
        }
    
        /**
         * Sets wether sjs will be able to print to and clear the console.
         * @param {boolean} showPrint default: True
         */
        showPrint(arg) {
            this.showPrintFlag = arg
        }
    
        /** 
         * Sets wether sjs errors halt the program or not when they occur
         * @param {boolean} endOnError default: False
         */
        endOnError(arg) {
            this.endOnErrorFlag = arg
        }


    // _________________________ RUN PROGRAM _________________________


    
 /**
     * Runs through the program line by line and 
     * interprets it into Javascript.
     */
    async runProgram() {
    
        this.program = this.programCast()
    
        this.runTime = Date.now() // initialise runTime
    
        if (this.hasInput) {
            this.initialiseConsoleInput()
        }
    
        for (this.currentLine = this.functionLines; // skip hooked functions
        this.currentLine < this.program.length; 
        this.currentLine++) {
    
            counters.LR.timesCalled += 1

            if (this.hasInput) await sleep(0);
            
            if (!this.running) {
                if (this.showRunTimeFlag) this.printRunTime()
                if (this.hasInput) process.stdin.destroy()
                return
            }
    
            if (this.skipLines !== 0) {
                this.currentLine += this.skipLines
                this.skipLines = 0
            }
    
            let line = this.program[this.currentLine]
            if (line === undefined) {
                this.running = false
                continue
            }

            let t = process.hrtime()
    
            this.interpretLine(line)

            if (lines.has(line)) {
                lines.set(line, {time: lines.get(line).time + process.hrtime(t)[1], called: lines.get(line).called + 1})}
            else lines.set(line, {time: process.hrtime(t)[1], called: 1})
        }
    
        if (this.showRunTimeFlag) this.printRunTime()
        if (this.hasInput) process.stdin.destroy()
    }   

    
    /**
     * Brains of the operation, completes brackets and resolves all programming
     * @param {String} line A string of the current line
     */
    interpretLine(line) {
        counters.IL.timesCalled += 1

        line = this.completeBrackets(line)
        line = line.trim()

        // splits line into sections
        let lineArr = line.split(" ") 

        const instruction = lineArr[0]

        let returnVal = line 

         // complete operations
        if (this.operations.includes(instruction)) {
            let args = line.slice(line.indexOf(instruction) + instruction.length).trim()

            returnVal = this.completeOperations(instruction, args, lineArr)
        }

        // resolve logic
        if (this.logic.includes(instruction)) {
            let comparison = instruction
            let input1 = lineArr[1]
            let input2 = lineArr[2]

            returnVal = this.resolveLogic(comparison, input1, input2)
        }

        // do math
        if (this.math.includes(instruction)) {
            let operation = lineArr[0]
            let value1 = lineArr[1]
            let value2 = lineArr[2]

            returnVal = this.solveMath(operation, value1, value2)
        }


        // create variable
        if (this.primitives.includes(instruction)) {
            let name = lineArr[1]

            let type = instruction
            let value
            if (type == "num") {
                lineArr = lineArr.filter(x => x != '') // allows for spacing in variables
                value = lineArr[3] || "0"
            }
            if (type === "str") value = lineArr.splice(3).join(' ')

            this.createVariable(name, value, type)
        }

        // extended math functions
        if (this.eMath.includes(instruction)) {
            let args = line.split(" ")[1] || ""
        
            if (args.startsWith(this.readStart)) {
                args = this.variables.get(args.slice(1, args.length-1))
            }   
            args = this.checkIfStringIsNumber(args)
        
            let ref = false
            if (this.variables.has(args)) {
                ref = args
                args = this.variables.get(args)
            }
            // arrays
            if (args.toString().indexOf(":") !== -1) {
                let indexes = this.getArrayIndexes(args) 
                args = this.getArrayAtIndex(args, indexes)
            }

            returnVal = this.performEMath(instruction, args)
            if (ref) this.variables.set(ref, returnVal)
        }

        // create array
        if (this.arrayTag === instruction) {
            let name = lineArr[1]
            let value = line.split("=")[1] // string e.g a, b, c instead of ['a,', 'b,', 'c']

            this.createArray(name, value)
        }

        return returnVal
    }


    /**
     * Isolates instructions in brackets and solves them individually, returning the result
     * @param {String} line 
     * @returns {String} Finished line without brackets
    */
   completeBrackets(line) {
        counters.CB.timesCalled += 1

        if (line === undefined) {
           let errObj = {
               line: line,
               lineNum: this.currentLine,
               program: this.program
            }
            return this.error("Given undefined line!", errObj)
        }
        
        // if line has brackets, recursively complete
        while (line.indexOf('(') !== -1 && line.indexOf(')') !== -1) {
            // get indexes of first ( and )
            let start = line.indexOf('(') + 1
            let end = line.indexOf(')')
            
            // get string in between first ( and )
            let check = line.slice(start, end)
            
            // if there are ( in the string, keep cutting down until there isnt (deepest point)
            while (check.indexOf('(') !== -1) {
                start = line.indexOf('(', start) + 1
                check = check.slice(check.indexOf('(')+1, end)
            }
            
            // resolve whats inside brackets
            let substitute = this.interpretLine(check)
            
            // insert result of bracket in bracket's place
            line = line.slice(0, start-1) + substitute + line.slice(end+1)
        }

        return line
    }
    



    // _________________________ EXECUTE INSTRUCTIONS _________________________
    


    /**
     * Gets the scope (code in between { }) for functions, comparisons, loops etc.
     * @param {String} line instruction fed into the function
     * @returns {Array} Array of line strings
     */
    getScopeLength(line) {
        counters.GS.timesCalled += 1

        let label = line[line.length-1]
        if (label.startsWith(this.scopeStart)) label = label.slice(1)

        let start = this.currentLine
        let end = this.program.indexOf(this.scopeEnd + label, this.currentLine)

        return end - start
    }


    /**
     * Stores a variable with a name and value in the map _Interpreter.variables
     * @param {String} name name of variable
     * @param {*} value string or number value of variable
     */
    createVariable(name, value, type) {
        counters.CV.timesCalled += 1
        let t = Date.now()

        if (this.reserved.includes(name)) {
            const errObj = {
                name: name,
                value: value
            }
            return this.error(`Can't initialise variable with reserved keyword: ${name} `, errObj) 
        }
        if (this.storedFunctions.has(name)) {
            const usedFuncNameErr = {
                name: name,
            }
            return this.error(`Can't intialise variable with already declared function name: ${name}`, usedFuncNameErr)
        }

        // set variable values
        if (type === "num") {
            value = this.removeReadBrackets(value)

            if (this.variables.has(value)) value = this.variables.get(value)
            else if (value.indexOf(":") !== -1) {
                let indexes = this.getArrayIndexes(value)
                value = this.getArrayAtIndex(value, indexes)
            }
            else if (this.constants.has(value)) value = this.constants.get(value)

            value = +value
        }
        else value = this.insertVariablesInString(value)

        this.variables.set(name, value)
        counters.CV.timeElapsed += Date.now() - t
    }


    /**
     * Stores / creates an array with a name and value in the map _Interpreter.arrays
     * @param {String} name name logged into array map
     * @param {String} value string containing the values
     */
    createArray(name, value) {
        counters.CA.timesCalled += 1
        let t = Date.now()

        // errors
        if (this.reserved.includes(name)) {
            const errObj = {
                name: name,
                value: value
            }
            return this.error(`Can't initialise array with reserved keyword: ${name}`, errObj) 
        }
        if (this.storedFunctions.has(name)) {
            const usedFuncNameErr = {
                name: name,
                values: value
            }
            return this.error(`Can't intialise array with already declared function name: ${name}`, usedFuncNameErr)
        }

        let values = [] // for empty arrays
        if (value !== undefined) values = value.split(',')

        // logic
        for (let i = 0; i < values.length; i++) {
            let v = values[i].trim()
            // v without []
            let vNoRead = v.slice(1, v.length-1)

            if (this.arrays.has(vNoRead)) {
                v = this.arrays.get(vNoRead)
            }
            else {
                v = this.insertVariablesInString(v)
                v = this.checkIfStringIsNumber(v)
    
                if (this.variables.has(v)) value = this.variables.get(v)
            }

            values[i] = v
        }

        this.arrays.set(name, values)
        counters.CA.timeElapsed += Date.now() - t
    }


    /**
     * Comples math operations with two inputs
     * @param {String} instruction the maths operation being performed
     * @param {*} value1 Variable name reference or value
     * @param {*} value2 Variable name reference or value
     * @returns Result of math operation and updates value1 if reference is given
     */
    solveMath(instruction, value1, value2) {
        counters.SM.timesCalled += 1
        let t = Date.now()

        let preVariables = [value1, value2]

        let readOnly = false
        if (value1.startsWith(this.readStart)) {
            readOnly = true
            value1 = value1.slice(1, value1.length-1)
        }
        let val1Index = []

        // variables -> array with indexes -> array
        if (this.variables.has(value1)) value1 = this.variables.get(value1)
        else if (value1.indexOf(":") !== -1) {
            val1Index = this.getArrayIndexes(value1)
            value1 = this.getArrayAtIndex(value1, val1Index)
        }

        // variables -> array with indexes 
        if (this.variables.has(value2)) value2 = this.variables.get(value2)
        else if (value2.indexOf(":") !== -1) {
            let indexes = this.getArrayIndexes(value2)
            value2 = this.getArrayAtIndex(value2, indexes)
        }

        // unary operator '+' converts to float
        value1 = +value1
        value2 = +value2

        const nanErrObj = {
            instruction: instruction, 
            value1: value1,
            value2: value2,
            givenValues: preVariables
        }
        if (isNaN(value1)) return this.error("value 1 is NaN", nanErrObj)
        if (isNaN(value2)) return this.error("value 2 is NaN", nanErrObj)

        let result

        // switch is literally the fastest thing ever, can't replace its ugly ass
        switch (instruction) {
            case "add":
                result = value1 + value2
                break;
            case "sub":
                result = value1 - value2
                break;
            case "mul":
                result = value1 * value2
                break;
            case "div":
                result = value1 / value2
                break;
            case "mod":
                result = value1 % value2
                break;
            case "pow":
                result = Math.pow(value1, value2)
                break;
        }

        if (readOnly === false) {
            let name = preVariables[0]
            if (this.variables.has(name)) this.variables.set(name, result)
            else {

                let arrName = name.slice(0, name.indexOf(":"))
                let arr = this.arrays.get(arrName)

                // records progress of array to return back to after assignment
                let steps = []
                val1Index.forEach(i => {
                    steps.push(arr)
                    arr = arr[i]
                })
                steps.push(result)

                for (let i = steps.length-2; i >= 0; i--) {
                    let index = val1Index[i]
                    steps[i][index] = result
                    result = steps[i]
                }

                arr = steps[0]

                this.arrays.set(arrName, arr) 
            }
        }

        counters.SM.timeElapsed += Date.now() - t
        return result
    }


    /**
     * Runs given input through more math operations in the extendedMath.js file,
     * Includes floor, ceil, round, absolute and random functions
     * @param {String} instruction Math operation such as floor, ceil, rand etc.
     * @param {Number} value Any number input
     * @returns {Number} Returns number output
     */
    performEMath(instruction, val) {
        if (val == undefined) {
            const undefinedValErr = {
                instruction: instruction,
                value: val
            }
            return this.error('Given undefined value!', undefinedValErr)
        }

        switch(instruction) {
            case "flr": //  floor
                return floor(val)
            case "cel": //  ceil
                return ceil(val)
            case "rnd": //  round
                return round(val)
            case "ran": //  rand
                return rand(val)
            case "abs": //  absolute
                return absolute(val)
            case "sin": // sine
                return sin(val)
            case "cos": // cosine
                return cos(val)
            case "tan": // tangent
                return tan(val)

        }
    }


    /**
     * Completes comparisons
     * @param {String} comparison logic comparison to make between input 1 and 2
     * @param {*} input1 string, number or variable reference
     * @param {*} input2 string, number or variable reference
     * @returns A bool based on logic and inputs
     */
    resolveLogic(comparison, input1, input2) {
        counters.RL.timesCalled += 1
        let t = Date.now()

        // if references, grab variable values
        if (this.variables.has(input1)) input1 = this.variables.get(input1)
        if (this.constants.has(input1)) input1 = this.constants.get(input1)
        if (this.variables.has(input2)) input2 = this.variables.get(input2)
        if (this.constants.has(input2)) input2 = this.constants.get(input2)

        // arrays
        if (typeof input1 === 'string' && input1.indexOf(":") !== -1) {
            let indexes1 = this.getArrayIndexes(input1)
            input1 = this.getArrayAtIndex(input1, indexes1)
        }
        if (typeof input2 === 'string' && input2.indexOf(":") !== -1) {
            let indexes2 = this.getArrayIndexes(input2)
            input2 = this.getArrayAtIndex(input2, indexes2)
        }

        input1 = this.checkIfStringIsNumber(input1)
        input2 = this.checkIfStringIsNumber(input2)

        counters.RL.timeElapsed += Date.now() - t

        // console.log(input1, input2)

        switch (comparison) {
            case "equ": //equal
                return (input1 == input2)
            case "neq": //not equal
                return (input1 != input2)
            case "lst": //less than
                return (input1 < input2)
            case "grt": //greater than
                return (input1 > input2)
            case "lte": //less than or equal to
                return (input1 <= input2)
            case "gte": //greater than or eqaul to
                return (input1 >= input2)
            case "not": 
                return (input1 == 'false')
            case "or": // atleast one input == true 
                return ((input1 == 'true') || (input2 == 'true'))
            case "and": // both inputs == true
                return ((input1 == 'true') && (input2 == 'true'))

        }
    }


    /**
     * Runs through operations and executes their functions, an operations manager
     * @param {String} instruction Given operation
     * @param {*} args given parameters / argumets
     * @param {Array} scope Program lines between an instructions { }
     */
    completeOperations(instruction, args, lineArr) {
        counters.CO.timesCalled += 1

        let returnVal = instruction

        switch (instruction) {
            case "com": // comparison
                this.comparison(lineArr, args)
                break;
            case "brk": // break loop
                this._break(lineArr, args)
                break;
            case "prn": // print to console
                this.print(args)
                break;
            case "con": // concat strings
                returnVal = this.concatenate(args)
                break;
            case "clr": // clear console
                this.clear()
                break; 
            case "ext": // exit program
                this.exitProgram(args)
                break; 
            case "col": // colour - add colours and whatnot to console
                returnVal = this.stylePrint(args)
                break; 
            case "run": // run functions
                returnVal = this.runFunction(args) 
                break;
            case "len": // get length of strings and arrays
                returnVal = this.arrayLength(args)
                break;
            case "mov": // add to arrays
                returnVal = this.moveIntoArray(args)
                break;
            case "del": // delete variables or array values
                returnVal = this.delete(args)
                break;
            case "set":
                returnVal = this.set(args)
                break;
            case "time": // Creates / updates benchmark
                returnVal = this.updateBenchmark(args) 
                break;
            case "join":
                returnVal = this.arrJoin(args)
                break;
            case "wait":
                this.wait(args)
                break;
            case "inp":
                this.onKeyStroke(lineArr)
                break;
            case "inpType":
                this.changeInputType(args) 
                break;
            case "utf":
                returnVal = this.convertToUtf(args) 
                break;
            case "hex":
                returnVal = this.convertToHex(args) 
                break;

            case this.endOfLoopFlag: // end of loop (love this workaround)
                this.currentLine -= parseInt(args)
                break;
            case this.funcReturn: // end of function
                returnVal = this._return(args)
                break;
        }
        
        return returnVal
    }




    // _________________________ OPERATION FUNCTIONS _________________________



    /**
     * Skips lines equal to it's scope size
     * @param {Array} scope 
     */
    _break(lines) {
        let scope = this.getScopeLength(lines)
        
        this.skipLines = scope
    }


    /**
     * Useless?
     * @param {Array} scope 
     * @param {Array} args 
     */
    loop(scope, args) {
        // useless
    }


    /**
     * If the comparison returns false (args[0]),
     * skipLines = scope
     * @param {Array} scope 
     * @param {String} args 
     */
    comparison(lines, args) {         
        if (args.includes("false")) {
            let scope = this.getScopeLength(lines)
            this.skipLines = scope
        }
    }


    /**
     * 
     * @param {String} args given strings to concatenate
     * @returns concatenated string
     */
    concatenate(args) {
        counters.CON.timesCalled += 1
        let t = Date.now()

        args = args.split(" ")
        let firstArg = args[0]
        let elements = args.slice(1)

        let value = ""
        if (this.variables.has(firstArg)) value = this.variables.get(firstArg)
        if (this.constants.has(firstArg)) value = this.constants.get(firstArg)
                   
        elements.forEach(e => {
            e = this.checkIfStringIsVariable(e)

            value += e
        })

        if (!firstArg.startsWith(this.readStart) && !firstArg.endsWith(this.readEnd)) {
            this.variables.set(firstArg, value)
        }

        counters.CON.timeElapsed += Date.now() - t
        return value
    }


    /**
     * 
     * @param {String} args string which will be worked with and printed to the console
     * Prints to the console with the prefix - PROGRAM:
     */
    print(args) {        
        if (!this.showPrintFlag) return
        args = this.insertVariablesInString(args)

        let formatting = style.t_cyan + '%s' + this.backgroundStyling + this.textStyling
        if (this.isBold) formatting += style.bold
        formatting += '%s' + style.reset

        console.log(formatting, "PROGRAM: ", args)
    }

    
    /**
     * Clears the console
     */
    clear() {
        if (!this.showPrintFlag) return
        console.clear()
    }


    /**
     * Styles the interpreters print function with given args
     * @param {String} args given colours and parameters to style the print with
     * @returns 
     */
    stylePrint(args) {
        args = args.split(" ")

        if (args[0] === '') return 

        let text = args[0]
        let background = args[1]
        let isBold = args[2]

        if (background === undefined) background = ""

        if (isBold === undefined) isBold = ""
        else if (isBold === '1' || isBold === 'true') this.isBold = true
        else if (isBold === '0' || isBold === 'false') this.isBold = false

        text = text.toLowerCase()
        background = background.toLowerCase()

        let textStyle = text
        let backgroundStyle = background

        // heres where the magic happens baby
        // note: due to the actual console itself, some colours only show up
        // or don't show up due to the background colour
        if (text === 'black')   textStyle = style.t_black
        if (text === 'red')     textStyle = style.t_red
        if (text === 'yellow')  textStyle = style.t_yellow
        if (text === 'green')   textStyle = style.t_green
        if (text === 'blue')    textStyle = style.t_blue
        if (text === 'magenta') textStyle = style.t_magenta
        if (text === 'cyan')    textStyle = style.t_cyan  
        if (text === 'white')   textStyle = style.t_white
        if (text === 'gray')    textStyle = style.t_gray
        if (text === 'grey')    textStyle = style.t_gray
        if (text === 'reset')   textStyle = style.reset
        if (text === 'default') textStyle = style.reset
        
        if (background === 'black')     backgroundStyle = style.b_black
        if (background === 'red')       backgroundStyle = style.b_red
        if (background === 'yellow')    backgroundStyle = style.b_yellow
        if (background === 'green')     backgroundStyle = style.b_green
        if (background === 'blue')      backgroundStyle = style.b_blue
        if (background === 'magenta')   backgroundStyle = style.b_magenta
        if (background === 'cyan')      backgroundStyle = style.b_cyan  
        if (background === 'white')     backgroundStyle = style.b_white
        if (background === 'gray')      backgroundStyle = style.b_gray
        if (background === 'grey')      backgroundStyle = style.b_gray
        if (background === 'default')   backgroundStyle = style.reset
        if (background === 'reset')     backgroundStyle = style.reset

        this.textStyling = textStyle
        this.backgroundStyling = backgroundStyle

        
        if (textStyle === style.reset) return textStyle + backgroundStyle
        if (backgroundStyle === style.reset) return backgroundStyle + textStyle
        return textStyle + backgroundStyle
    }


    /**
     * Searches for the given function name in stored functions
     * the overwrites the currentLine to that function
     * Then runs function in sandbox
     * @param {String} functionName name of the function
     */
    runFunction(functionName) {
        counters.RF.timesCalled += 1
        let t = Date.now()

        // store the line the function call is on and the function name in functionPath
        let pathObj = {
            parent: functionName,
            line: this.currentLine // line is used to backtrack after function is complete
        }
        this.functionPath.push(pathObj)

        // get function object which has location and return value
        let func = this.storedFunctions.get(functionName)
        if (func === undefined) {
            const noFunctionErr = {
                function: functionName,
                storedFunctions: this.storedFunctions
            }
            return this.error(`You tried to call a function that does not exist (${functionName})! Function names are case sensitive, or maybe there's a typo.`, noFunctionErr)
        }
        this.currentLine = func.index - 1
        
        // run function locally to get return value 
        let t2 = Date.now()
        while (1) {
            counters.FS.timesCalled += 1
            let line = this.program[this.currentLine]

            if (this.skipLines === 0) this.interpretLine(line)
            else this.skipLines--
            
            if (line.startsWith(this.funcReturn) && this.skipLines === 0) {
                break;
            }

            this.currentLine++
        }
        counters.FS.timeElapsed += Date.now() - t2 
        
        counters.RF.timeElapsed += Date.now() - t
        return func.returnValue
    }


    /**
     * Gets the length of a string or array, can be passed variables using []
     * @param {String} args A string or [array/variable] name 
     * @returns 
     */
    arrayLength(args) {
        counters.AL.timesCalled += 1

        if (this.arrays.has(args)) return this.arrays.get(args).length

        let indexes = this.getArrayIndexes(args)
        let arr = this.getArrayAtIndex(args, indexes)  // returns name of array if no indexes
        
        if (arr !== args) return arr.toString().length

        // return length of variables value
        if (this.variables.has(args)) return this.variables.get(args).toString().length

        // if nothing is found, return strings length
        return args.length
    }


    /**
     * Inserts a given value into an array at a given index, or appends to the end
     * of the array
     * @param {String} args given input, starting with array name, possible index, and value
     */
    moveIntoArray(args) {
        counters.MIA.timesCalled += 1
        let t = Date.now()

        let array = args.slice(0, args.indexOf(" "))

        // value moved into array
        let input = args.slice(args.indexOf(array) + array.length + 1).toString()

        // check for variables, arrays (do we need to check for constants?)
        if (input.startsWith(this.readStart) && input.endsWith(this.readEnd)) {
            input = input.slice(1, input.length-1) // remove brackets

            if (this.variables.has(input)) input = this.variables.get(input)
            if (this.arrays.has(input)) input = this.arrays.get(input)
            if (input.indexOf(":") !== -1) {
                let inpIndex = this.getArrayIndexes(input)
                input = this.getArrayAtIndex(input, inpIndex)
            }
        }

        // get indexes if any
        let name = array
        let indexes = [] 
        if (array.indexOf(":") !== -1) {
            name = array.slice(0, array.indexOf(":"))
            indexes = this.getArrayIndexes(array)
        }

        // determine if read only    
        let readOnly = false
        if (name.startsWith(this.readStart)) {
            readOnly = true
            name = name.slice(1, name.length-1)
        }       

        array = this.arrays.get(name)
        
        // errors
        const arrOutOfBoundsErr = () => {
            const outOfBounds = {
                instruction: "mov",
                arrName: name,
                array: array,
                indexes: indexes
            }
            return this.error("Array index out of bounds!", outOfBounds)
        }
        
        if (array === undefined) {
            const noArrErr = {
                arrName: name,
                arrays: [...this.arrays.keys()]
            }
            return this.error(`No array with name: ${name}`, noArrErr)
        }

        let insertIndex = indexes[indexes.length-1]
        if (insertIndex === undefined) insertIndex = array.length

        for (let i = 0; i < indexes.length-1; i++) {
            // errors
            if (array[indexes[i]] === undefined) {
                arrOutOfBoundsErr()
            }
            array = array[indexes[i]]
        }

        // edit array if not read only
        if (!readOnly) {
            if (typeof array !== 'object') {
                const notArrErr = { 
                    arr: array,
                    originalArray: this.arrays.get(name),
                    indexes: indexes
                }
                return this.error("Value given wasn't an array!", notArrErr)
            }
            // inserts item at index
            array.splice(insertIndex, 0, input)
            counters.MIA.timeElapsed += Date.now() - t
            return array
        }

        // copy array
        let arrCopy = [...array]


        // errors
        if (array[insertIndex] === undefined) {
            arrOutOfBoundsErr()
        }
        // inserts item at index
        arrCopy.splice(insertIndex, 0, input)

        counters.MIA.timeElapsed += Date.now() - t
        return arrCopy
    }


    /**
     * Deletes variables, arrays, or array elements from within interpreter storage
     * @param {String} args The given item you want to delete, variable name, array name, or array with index
     * @returns 
     */
    delete(args) {
        counters.DEL.timesCalled += 1
        let t = Date.now()

        // delete variables
        if (this.variables.has(args)) {
            return this.variables.delete(args)
        }

        // delete benchmarkers
        if (this.benchmarkers.has(args)) {
            return this.benchmarkers.delete(args)
        }

        // delete arrays / string chars
        let indexes, name
        if (args.indexOf(":") !== -1) {
            indexes = this.getArrayIndexes(args)
            name = args.slice(0, args.indexOf(":"))
        }
        else {
            name = args
        }

        // read only
        let readOnly = false
        if (name.startsWith(this.readStart)) {
            readOnly = true
            name = name.slice(1) // remove read start
        }
        
        // arrays
        if (this.arrays.has(name)) {
            if (readOnly && index !== undefined) {
                // copy array
                let x = []
                this.arrays.get(name).forEach(v => {
                    x.push(v)
                })
                return x.splice(index, 1)
            }
            if (indexes !== undefined) {
                let arr = this.arrays.get(name)
                for (let i = 0; i < indexes.length-1; i++) {
                    arr = arr[indexes[i]]
                }
                if (arr === undefined) {
                    const delOutOfBoundsErr = {
                        arrayGiven: this.arrays.get(name),
                        indexes: indexes
                    }
                    return this.error("Tried to delete array element out of bounds!", delOutOfBoundsErr)
                }

                counters.DEL.timeElapsed += Date.now() - t
                return arr.splice(indexes[indexes.length-1], 1)
            }
            else return this.arrays.delete(name)
        }

        // strings 
        if (this.variables.has(name)) {
            let x = this.variables.get(name)
            x = x.toString() || x

            x = x.slice(0, indexes[0]) + x.slice(indexes[0] + 1, x.length)

            if (!readOnly) {
                this.variables.set(name, x)
            }
            
            return x
        }
    }

    
    /**
     * 
     * @param {*} args 
     */
    set(args) {
        counters.SET.timesCalled += 1
        let t = Date.now()

        let name = args.slice(0, args.indexOf(" "))
        let value = args.slice(name.length + 1)

        if (value.indexOf(this.readStart) !== -1 && value.indexOf(this.readEnd) !== -1) {
            value = value.slice(1, value.length-1)
        }

        if (value.indexOf(":") !== -1) {
            let indexes = this.getArrayIndexes(value)
            value = this.getArrayAtIndex(value, indexes)
            if (value === undefined) { 
                const arrOutOfBoundsErr = {
                    instruction: "set",
                    array: name,
                    value: value,
                    indexes: indexes
                }
                return this.error('Array index out of bounds!', arrOutOfBoundsErr)
            }
        }
        else if (this.variables.has(value)) value = this.variables.get(value)
        else if (this.constants.has(value)) value = this.constants.get(value)
        else if (this.arrays.has(value)) {
            // arrays can be passed by value instead of reference through [...arr],
            // but each of their values are still references, this function fix that
            //  https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript/10916838#10916838
            // value = structuredClone(this.arrays.get(value))
            value = JSON.parse(JSON.stringify(this.arrays.get(value)))

            // value = this.arrays.get(value).map(arr => arr.slice(0))
        }

        counters.SET.timeElapsed += Date.now() - t
        if (this.variables.has(name)) { this.variables.set(name, value); return value }
        if (this.arrays.has(name)) { this.arrays.set(name, value); return value }
        if (name.indexOf(":") !== -1) {
            let indexes = this.getArrayIndexes(name)
            name = name.slice(0, name.indexOf(":"))
            let arr = this.arrays.get(name)

            let replaceIndex = indexes[indexes.length-1]
            for (let i = 0; i < indexes.length-1; i++) {
                let index = indexes[i]
                arr = arr[index]
            }
            
            if (arr === undefined) {
                const arrOutOfBoundsErr = {
                    instruction: "set",
                    array: name,
                    arrayValues: this.arrays.get(name),
                    indexes: indexes
                }
                return this.error('Array index out of bounds!', arrOutOfBoundsErr)
            }

            arr[replaceIndex] = value

            return value

        } 
    

        const notVarOrArrErr = {
            name: name,
            args: args
        }
        return this.error(`No variable or array with name: ${name}`, notVarOrArrErr)
    }


    /**
     * this makes me sad, its not sjs its just a cheat, a quick duct-taped function
     * piece of shit I did to get over 30fps for the raycaster just so 
     * I could be done, fuck this operation
     * @param {String} args 
     */
    arrJoin(args) {
        counters.JOIN.timesCalled += 1
        let t = Date.now()

        let arrName = args.split(" ")[0]
        let joinString = args.slice(arrName.length + 1)
        joinString = this.insertVariablesInString(joinString)

        let readOnly = false
        if (arrName.startsWith(this.readStart) && arrName.endsWith(this.readEnd)) {
            arrName = arrName.slice(1, arrName.length-1)
            readOnly = true
        }

        let arr, indexes
        if (arrName.indexOf(":") !== -1) {
            indexes = this.getArrayIndexes(arrName)
            arrName = arrName.slice(0, arrName.indexOf(":"))
            arr = this.getArrayAtIndex(arrName, indexes)
        }
        else arr = this.arrays.get(arrName)

        let joinedArr = arr.join(joinString)

        if (!readOnly) {
            let result = joinedArr
            if (indexes !== undefined) {
                let arrCopy = this.arrays.get(arrName)
                // records progress of array to return back to after assignment
                let steps = []
                indexes.forEach(i => {
                    steps.push(arrCopy)
                    arrCopy = arrCopy[i]
                })
                steps.push(result)

                for (let i = steps.length-2; i >= 0; i--) {
                    let index = indexes[i]
                    steps[i][index] = result
                    result = steps[i]
                }
            }

            this.arrays.set(arrName, result)
        }

        counters.JOIN.timeElapsed += Date.now() - t
        return joinedArr
    }


    /**
     * Synchronously pauses program for given ms
     * @param {Number} ms 
     */
    wait(ms) {
        ms = this.checkIfStringIsNumber(ms)
        if (isNaN(ms) || ms === undefined || ms === "") {
            const incorrectMsErr = {
                ms: ms
            }
            return this.error(`Given an incorrect ms delay!`, incorrectMsErr)
        } 

        // https://stackoverflow.com/questions/6921895/synchronous-delay-in-code-execution
        let start = Date.now()
        let now = Date.now()
        while(now - start < ms) {
            now = Date.now()
        }
    }


    /**
     * Sets up a keystroke event which runs an sjs function when keys are pressed
     * @param {*} args 
     */
    onKeyStroke(args) {
        
        if (this.inputLine !== undefined) {
            this.inputLine = undefined
            return this.error("Multiple input blocks! SJS can only have 1 input block", {})
        }
        
        let varName = args[1]
        let endLabel = this.scopeEnd + args[2].slice(1)
        
        this.variables.set(varName, undefined)
        
        this.inputLine = this.currentLine + 1

        let length = this.getScopeLength(args)
        this.currentLine += length // skip input block

        // event emits when key is pressed
        process.stdin.on('data', (key) => {
            if (this.inputLine === undefined) {
                this.input.destroy()
                return
            }

            let checkPoint = this.currentLine + this.skipLines
            this.currentLine = this.inputLine  

            this.variables.set(varName, key)

            while (1) {
                let line = this.program[this.currentLine]

                if (this.skipLines === 0) this.interpretLine(line)
                else this.skipLines--
                
                if (line.startsWith(endLabel) && this.skipLines === 0) {
                    break;
                }

                this.currentLine++
            }

            this.currentLine = checkPoint
        })
    }


    /**
     * changes stdin output and rawMode state
     * @param {Number} inputType 
     */
    changeInputType(inputType) {
        inputType = parseInt(inputType) 

        const types = [
            () => {process.stdin.setRawMode(true)},
            () => {process.stdin.setRawMode(false)},
            () => {process.stdin.setEncoding('utf-8')},
            () => {process.stdin.setEncoding('hex')}
        ]

        if (types[inputType] === undefined) {
            const incorrectTypeErr = {
                type: inputType
            }
            return this.error(`Input type out of range 0 - ${types.length-1}`, incorrectTypeErr)
        }
        types[inputType]()
    }


    /**
     * Converts hex string input into utf-8 string
     * e.g 73 --> 's'
     * @param {String} str hex input
     * @returns utf-8 encoded string
     */
    convertToUtf(str) {
        str = this.checkIfStringIsVariable(str)
        str = str.toString()
        
        // lol no idea 
        // https://stackoverflow.com/questions/13865302/how-to-convert-a-hex-encoded-utf-8-string-to-a-regular-string
        let decoded = (decodeURIComponent(str.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&')))
 
        return decoded
    }


    /**
     * Converts string input into hex string
     * e.g 's' --> 73
     * @param {String} str string input
     * @returns hex string
     */
    convertToHex(str) {
        str = this.checkIfStringIsVariable(str)
        str = str.toString()

        let hex = ""

        let result = ""
        for (let i = 0; i < str.length; i++) {
            hex = str.charCodeAt(i).toString(16);
            result += hex.slice(-4);
        }
    
        return result
    }


    /**
     * Ends a function and returns given arguments
     * @param {*} args 
     * @returns 
     */
    _return(args) { 
        let path = this.functionPath[this.functionPath.length-1]
        
        let func = this.storedFunctions.get(path.parent)
        func.returnValue = this.insertVariablesInString(args)

        // set current line to stored temp value before the function was executed 
        // then remove it from the array
        this.currentLine = path.line
        this.functionPath.pop()

        return func.returnValue
    }

    
    /**
     * Creates / updates benchmarks
     * @param {String} label Label used to ID benchmark
     * @returns 
     */
    updateBenchmark(label) {
        let benchmark = this.benchmarkers.get(label)
        // update benchmark
        if (benchmark !== undefined) {
            return (process.hrtime(benchmark)[1] / 1000000 + process.hrtime(benchmark)[0] * 1000) 
        }
        // create benchmark
        else {
            this.benchmarkers.set(label, process.hrtime())
        }
    }



    // _________________________ STRING FUNCTIONS _________________________



    /**
     * Searches string for arrays, variables and constants, then replaces them.
     * This string could be given as a value for a print instruction, a math operation
     * or even an error message.
     * Any variables, constants or arrays surrounded by [ and ] will be replaced
     * @param {String} string string input which will be matched against existing variables and constants
     * @returns Given string parameter after replacing variables / constants
     */
    insertVariablesInString(string) {
        counters.IVIS.timesCalled += 1
        let t = Date.now()

        if (string == undefined) {
            const undefinedStringErr = {
                string: string
            }
            return this.error("An undefined value was given!", undefinedStringErr)
        }
        
        const rs = this.readStart
        const re = this.readEnd

        // string with no variables to be read can be returned 
        // this one if statement increased the ray casters performance by 40% lmao 
        // (that was in the recursion-based function, in this rewrite it has like 5% increase, avoid recursion.)
        if (string.indexOf(rs) == -1) return string

        // goes through items in [] and replace them with their current value
   
        while (string.indexOf(rs) !== -1 && string.indexOf(re) !== -1) {
            let inBrackets = string.slice(string.lastIndexOf(rs)+1, string.lastIndexOf(re))
            
            let value = ""

            if (this.variables.has(inBrackets)) value = this.variables.get(inBrackets)
            if (this.constants.has(inBrackets)) value = this.constants.get(inBrackets)
            if (this.arrays.has(inBrackets)) value = this.arrays.get(inBrackets)

            if (inBrackets.indexOf(":") !== -1 ) {
                let indexes = this.getArrayIndexes(inBrackets)
                value = this.getArrayAtIndex(inBrackets, indexes)
            }

            string = string.replaceAll(rs + inBrackets + re, value)
        }   

        counters.IVIS.timeElapsed += Date.now() - t
        return string
    }


    /**
     * Returns an array of indexes
     * @param {String} arr Array name with indexes involved
     * @returns 
     */
    getArrayIndexes(arr) {
        counters.GAI.timesCalled += 1
        let t = Date.now()

        if (typeof arr !== 'string') return arr
        
        let indexes = arr.split(":").slice(1)
        for (let i = 0; i < indexes.length; i++) {

            if (this.variables.has(indexes[i])) indexes[i] = this.variables.get(indexes[i])
            indexes[i] = parseInt(indexes[i])
        }
        
        counters.GAI.timeElapsed += Date.now() - t
        return indexes
    }


    /**
     * 
     * @param {string} arr Array's name (can have : in it)
     * @param {array} indexes Array of indexes used to move through array
     * @returns 
     */
    getArrayAtIndex(arr, indexes) {
        counters.GAAI.timesCalled += 1
        let t = Date.now()

        if (isNaN(indexes[0])) return arr
        let name

        if (arr.indexOf(":") !== -1) name = arr.slice(0, arr.indexOf(":"))
        else name = arr

        if (name.startsWith(this.readStart)) {
            name = name.slice(1)
        }
        if (name.endsWith(this.readEnd)) {
            name = name.slice(0, name.length-1)
        }

        arr = this.arrays.get(name)
        if (arr === undefined) {
            const noArrErr = {
                arrName: name,
                arrays: [...this.arrays.keys()]
            }
            return this.error(`No array with name: ${name}`, noArrErr)
        }
        let arrTemp = arr

        indexes.forEach(i => {
            if (arr === undefined) {
                const arrOutOfBoundsErr = {
                    array: name,
                    arrayValues: arrTemp,
                    indexes: indexes
                }
                return this.error('Array index out of bounds!', arrOutOfBoundsErr)
            }
            arr = arr[i]

        })

        counters.GAAI.timeElapsed += Date.now() - t
        return arr
    }


    /**
     * checks to see if a string should be a number
     * @param {String} val 
     * @returns 
     */
    checkIfStringIsNumber(val) {
        counters.CISIN.timesCalled += 1

        let x = parseFloat(val)
        if (typeof val == 'number' || typeof val == 'undefined') return val
        if (x.toString().length === val.length && !isNaN(x)) return x

        return val
    }


    /**
     * Removes [ and ] wrapping a string, if any exist
     * @param {String} string 
     * @returns 
     */
    removeReadBrackets(string) {
        if (string.startsWith(this.readStart) && string.endsWith(this.readEnd)) {
            string = string.slice(1, string.length-1)
        }
        return string
    }


    /**
     * TODO: RENAME
     * Checks to see if a given input e.g 'x' is a variable, constant, array etc.
     * Checks for inputs using read Only brackets, [ and ]
     * @param {String} str Variable / Array name (Must include read brackets)
     * @returns Value stored in memory
     */
    checkIfStringIsVariable(str) {
        if (str.startsWith(this.readStart) && str.endsWith(this.readEnd)) {
            str = str.slice(1,str.length-1)

            if (this.variables.has(str)) str = this.variables.get(str)
            if (this.constants.has(str)) str = this.constants.get(str)

            if (typeof str === "number") str = str.toString()

            // arrays
            let arrName = str.split(":")[0]
            if (str.indexOf(":") !== -1) {
                let indexes = this.getArrayIndexes(str)
                str = this.getArrayAtIndex(str, indexes)

                if (str === undefined) {
                    const arrOutOfBoundsErr = {
                        array: arrName,
                        arrayValues: this.arrays.get(arrName),
                        indexes: indexes
                    }
                    return this.error('Array index out of bounds!', arrOutOfBoundsErr)
                }
            }
        }

        return str
    }


    /**
     * Puts an equal amount of ) for every ( in a string
     * @param {String} string 
     * @returns 
     */
    balanceBrackets(string) {
        let openCount = string.split("").filter(x => (x == '(')).length
        let closeCount = string.split("").filter(x => (x == ')')).length

        for (let diff = openCount - closeCount; diff > 0; diff--) {
            string += ')'
        }

        return string    
    }







    // _________________________ MISC _________________________


    /**
     * initalises stdin and console interfaces to allow for
     * input to console during sjs execution
     */
    initialiseConsoleInput() {
        // read keystrokes
        // https://stackoverflow.com/questions/5006821/nodejs-how-to-read-keystrokes-from-stdin
        let stdin = process.stdin

        stdin.setRawMode(true)
        stdin.setEncoding('utf-8')
    }


    /**
     * Prints stored _Interpreter variables, functions and timers.
     * Doesn't print constants
     */
    printVariables() {
        let formatting = style.t_cyan + '%s' + style.reset
        console.log(formatting, "\n\nVariables: ", this.variables)
        console.log(formatting, "\nArrays: ", this.arrays)
        console.log(formatting, "\nFunctions: ", this.storedFunctions)
        console.log(formatting, "\nBenchmarkers: ", this.benchmarkers)
    }


    /**
     * 
     * @param {String} errorMsg message that describes the error
     * @param {Object} errorObj extra debug information relating to the error
     * @returns 
     */
    error(errorMsg, errorObj) {
        if (this.showErrorsFlag == false) return
        // if no defined errorObj, turn into string
        errorObj = (errorObj !== undefined)? errorObj : " " 

        // add line that error caused on and line above and below
        let prevLine = + (this.currentLine > 0)? this.program[this.currentLine-1] : ""
        let currentLine = ">> " + this.program[this.currentLine]
        let nextLine = (this.currentLine < this.program.length-1)? this.program[this.currentLine+1] : ""

        const errorLine = 
        `
       ${prevLine}
    ${currentLine}
       ${nextLine}
        `

        let formatting = style.t_red + '%s ' + style.reset
        console.log(formatting, "ERROR: " + errorLine + "\n" +
                                            "Message: " + errorMsg + "\n", 
                                            "Error Info: ", errorObj, "\n")
        if (this.endOnErrorFlag) this.running = false//while(1) {}
        return
    }


    /**
     * Exits the program by setting this.running property to false
     * @param {string} msg Optional message that displays when the program exits
     */    
    exitProgram(msg) {
        msg = this.insertVariablesInString(msg)

        let formatting = style.t_yellow + style.bold + '%s' + style.reset
        console.log(formatting, "\nPROGRAM EXITED:", msg)

        this.running = false
        if (this.hasInput) process.stdin.destroy()
    }


    printCounters() {
        let time = []
        let called = []

        for (let i in counters) {
            let c = counters[i]

            time.push({ name: c.name, timeElapsed: c.timeElapsed })
            called.push({ name: c.name, timesCalled: c.timesCalled } )
        }

        time = time.sort((a, b) => b.timeElapsed - b.timeElapsed)
        called = called.sort((a, b) => b.timesCalled - a.timesCalled)

        console.table(time)
        console.table(called)
    }


    printFuncPerformance() {
        let performance = []
        
        for (let c in counters) {
            let counter = counters[c]
            counter.averageTime = (counter.timeElapsed / counter.timesCalled)
            performance.push({name: counter.name, averageTime: counter.averageTime, timesCalled: counter.timesCalled})
        }

        performance = performance.sort((a, b) => b.averageTime - a.averageTime)
        performance = performance.filter(a => !isNaN(a.averageTime))
        console.table(performance)
    }
    
    printLinePerformance(lineAmount) {
        let performance = [...lines.entries()]

        if (lineAmount === undefined) lineAmount = 20

        for (let i = 0; i < performance.length; i++) {
            performance[i] = {
                line: (performance[i][0].length < 40)? performance[i][0] : performance[i][0].slice(0, 23) + "...",
                time: performance[i][1].time / 1000000,
                called: performance[i][1].called
            }
        }
        
        
        performance = performance.sort((a,b) => b.time - a.time)
        performance = performance.slice(0, lineAmount)

        console.table(performance)

    }

    printRunTime() {
        this.runTime = Date.now() - this.runTime
        console.log(`Program ran for: ${this.runTime}ms`)
    }

} 