import { readFileSync } from 'fs'
import { round, floor, ceil, rand, absolute } from './extendedMath.js'
import { style } from './console styling.js'

/**
 * Shitty JavaScript (sjs) Interpreter class
 */
export default class _Interpreter {   



    // _________________________ OBJECT _________________________



    /**
     * @param {path} filepath the relative filepath to the executing file
     * @param {Number} tickRate the speed the SJS interpreter does instructions at, leave undefined or 0 for max speed
     */
    constructor(filepath, tickRate) {
        this.program = this.getProgram(filepath)

        // script variables
        this.variables = new Map()

        this.primitives   = ["num", "str"]
        this.math         = ["add", "sub", "mul", "div", "mod", "pow"]
        this.eMath        = ["rnd", "flr", "cel", "ran", "abs"] 
        this.operations   = ["com", "prn", "brk", "con", "clr", "tic", 
                             "ext", "style", "run", "time"] 
        this.logic        = ["equ", "neq", "lst", "grt", "lte", "gte", "not", "or", "and"]
        this.comment      =  "*"
        this.loops        = ["lop", "for", "rep", "whl"]
        
        this.funcName     =  "fnc"
        this.storedFunctions = new Map()
        // functions are hooked to the top of the script, so by incrementing
        // this counter, the lines can be skipped at the start of the script
        this.functionLines = 0
        // temporary line numbers stored in this path so the interpreter can backtrack after a function
        this.functionPath = []
        this.funcReturn = "rtn"

        // Map to store label of active benchmarkers
        this.benchmarkers = new Map()

        // console colours which can be set
        this.textStyling = style.reset
        this.backgroundStyling = style.reset
        this.isBold = false

        // when theres an instruction on a line, this is set to true
        // this should hopefully prevent wasted time from low tick rates
        // this.lineHadInstruction = false

        // while true, the program runs, otherwise, exit program
        this.running = true

        this.constants = new Map()
            this.constants.set("TAB", "\t")
            this.constants.set("NEWLINE", "\n")
            this.constants.set("NEWSEGMENT", "\n\n\n\n")
            this.constants.set("SPACE", "\u0020")
            this.constants.set("NULL", 0)
            this.constants.set("UNDEFINED", undefined)

        this.scopeStart   = "{"
        this.scopeEnd     = "}"
        this.scopeFlag    = "@@"
        this.scopeDepth   = 0

        this.readStart    = "["
        this.readEnd      = "]"

        this.endOfLoopFlag = "endLoop"
        this.operations = this.operations.concat(this.endOfLoopFlag, this.funcReturn)

        this.tickRate = (tickRate != undefined) ? tickRate : 0

        this.currentLine  = 0

        // when compare statements are false or loops need 
        // to be broken out of etc, the runProgram() function
        // doesnt execute the next skipLines amount of lines
        this.skipLines = 0 

        // reserved keywords, variables and functions etc. cant be named these
        this.reserved = this.primitives.concat(this.math, this.eMath, this.operations,
                                               this.logic, this.comment, this.scopeStart,
                                               this.scopeEnd, this.scopeFlag, this.readStart,
                                               this.readEnd, this.endOfLoopFlag, this.funcName, 
                                               this.funcReturn)

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
        
        // break apart loops 
        let depth = 0
        for (let i = lineValues.length-1; i >= 0; i--) {
            // add labels to breaks
            if (lineValues[i].startsWith('brk')) {
                let breakDepth = (depth > 0)? depth-1 : 0 // if depth is 0 it would be -1, couldve found a better solution tbh
                lineValues[i] += " " + this.scopeFlag + breakDepth
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
                    const errObj = { line: lineValues[i], params: params }
                    return this.error("Not enough loop parameters provided!, make sure you've given a variable, a logic operation and an incrementor", errObj)
                }

                let loopVar = params[0].trim()

                // step 2, logic
                let logic = params[1].trim()

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
                let newComparison1 = "com (not (" + logic + ")) " + this.scopeStart + label
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
            if (!this.funcName.includes(line[0])) {
                continue // first time ive EVER used continue, but I hate nesting
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

            // TODO - MAKE VARIABLES NOT BE ABLE TO USE FUNCTION NAMES (or the other way around, whatevers easier)
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
    



    // _________________________ RUN PROGRAM _________________________



    /**
     * Runs through the program line by line and 
     * interprets it into Javascript
     */
    runProgram() {
        this.program = this.programCast()

        if (this.tickRate === 0) {
            for (this.currentLine = this.functionLines; // skip hooked functions
                 this.currentLine < this.program.length; 
                 this.currentLine++) {

                if (!this.running) return

                let line = this.program[this.currentLine]
                
                if (this.skipLines === 0) this.interpretLine(line)
                else this.skipLines--
            }
        }

        else {
            this.currentLine = this.functionLines // skip hooked functions

            let x = setInterval(() => {   

                if (!this.running) return

                let line = this.program[this.currentLine]
                if (this.skipLines === 0) this.interpretLine(line)
                else this.skipLines--

                this.currentLine++

                // end program
                if (this.currentLine === this.program.length) {
                    clearInterval(x)
                }
                
            }, this.tickRate);
        }
    }


    /**
     * Brains of the operation, completes brackets and resolves all programming
     * @param {String} line A string of the current line
     */
    interpretLine(line) {
        line = this.completeBrackets(line)
        line = line.trim()

        // splits line into sections
        let lineArr = line.split(" ") 

        const instruction = lineArr[0]

        let returnVal = line //{error: "default value"}

        // create variable
        if (this.primitives.includes(instruction)) {
            let name = lineArr[1]

            let type = instruction
            let value //= (instruction === "str")? lineArr.splice(3).join(' ') : lineArr[3]
            if (instruction === "str") value = lineArr.splice(3).join(' ')
            if (instruction === "num") value = lineArr[3]

            this.createVariable(type, name, value)
        }

        // do math
        if (this.math.includes(instruction)) {
            let operation = lineArr[0]
            let value1 = lineArr[1]
            let value2 = lineArr[2]

            returnVal = this.solveMath(operation, value1, value2)
        }

        // resolve logic
        if (this.logic.includes(instruction)) {
            let comparison = instruction
            let input1 = lineArr[1]
            let input2 = lineArr[2]

            returnVal = this.resolveLogic(comparison, input1, input2)
        }

        // extended math functions
        if (this.eMath.includes(instruction)) {
            let args = line.split(" ")[1]
            
            args = this.readVariables(args)
            let ref = false
            if (this.variables.get(args) !== undefined) {
                ref = args
                args = this.variables.get(args)
            }

            returnVal = this.performEMath(instruction, args, ref)
        }

        // complete operations
        if (this.operations.includes(instruction)) {
            let scope = this.getScope(lineArr)
            let args = line.slice(line.indexOf(instruction) + instruction.length).trim()

            returnVal = this.completeOperations(instruction, args, scope)
        }

        return returnVal
    }


    /**
     * Isolates instructions in brackets and solves them individually, returning the result
     * @param {String} line 
     * @returns {String} Finished line without brackets
    */
   completeBrackets(line) {
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
    getScope(line) {
        let label = line[line.length-1]
        if (label.indexOf(this.scopeStart) !== -1) label = label.slice(label.indexOf(this.scopeStart)+1)
        let index = this.currentLine

        // assumption for loops
        if (this.loops.includes(line[0])) {
            for (let i = index; i >= 0; i--) {
                if (this.loops.includes(this.program[i].split(" "[0]))) {
                    label = this.program[i].slice(this.program[i].indexOf(this.scopeStart) + 1)

                    index = i
                }
            }
        }
        let scope = []
        
        // gets code in scope + scopeEnd line
        for (let i = index+1; i < this.program.length; i++) {
            scope.push(this.program[i])

            if (this.program[i].slice(1) === label) return scope;
        }

        return {err: "NO SCOPE FOUND"}
    }


    /**
     * Stores a variable with a name and value in the map _Interpreter.variables
     * @param {String} name name of variable
     * @param {*} value string or number value of variable
     */
    createVariable(type, name, value) {
        if (this.reserved.includes(name)) {
            const errObj = {
                line: this.program[this.currentLine], 
                name: name,
                value: value
            }
            return this.error("Can't initialise variable with reserved keyword, please rename", errObj) 
        }
        if (this.storedFunctions.get(name) !== undefined) {
            const usedFuncNameErr = {
                line: this.program[this.currentLine], 
                name: name,
            }
            return this.error("Can't intialise variable with already declared function name! Please either rename the function or variable", usedFuncNameErr)
        }

        // constants and other variables
        value = this.insertVariablesInString(value)
        value = this.checkIfStringIsNumber(value)
        
        if (this.variables.get(value) != undefined) value = this.variables.get(value)

        this.variables.set(name, value)
    }


    /**
     * Comples math operations with two inputs
     * @param {String} instruction the maths operation being performed
     * @param {*} value1 Variable name reference or value
     * @param {*} value2 Variable name reference or value
     * @returns Result of math operation and updates value1 if reference is given
     */
    solveMath(instruction, value1, value2) {
        // square brackets mean read memory only, set flag to not update their value
        let readOnly = false
        if (value1.startsWith(this.readStart) && value1.endsWith(this.readEnd)) {
            value1 = value1.slice(1, value1.length-1)
            readOnly = true
        }

        // get reference so value can be updated after and replace reference with value
        let reference
        if (this.variables.get(value1) != undefined) {
            reference = value1
            value1 = this.variables.get(value1)
        }
        if (this.variables.get(value2) != undefined) {
            value2 = this.variables.get(value2)
        }  

        value1 = parseFloat(value1)
        value2 = parseFloat(value2) 


        const nanErrObj = {
            line: this.program[this.currentLine], 
            instruction: instruction, 
            val1: value1,
            val2: value2
        }
        if (isNaN(value1)) return this.error("val1 is NaN", nanErrObj)
        if (isNaN(value2)) return this.error("val2 is NaN", nanErrObj)

        let result = 0
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

        // update variable
        if (reference && !readOnly) this.variables.set(reference, result) 

        return result
    }


    /**
     * Runs given input through more math operations in the extendedMath.js file,
     * Includes floor, ceil, round, absolute and random functions
     * @param {String} instruction Math operation such as floor, ceil, rand etc.
     * @param {Number} value Any number input
     * @returns {Number} Returns number output
     */
    performEMath(instruction, val, ref) {
        switch(instruction) {
            case "flr": //  floor
                if (ref) this.variables.set(ref, floor(val))
                return floor(val)
            case "cel": //  ceil
                if (ref) this.variables.set(ref, ceil(val))
                return ceil(val)
            case "rnd": //  round
                if (ref) this.variables.set(ref, round(val))
                return round(val)
            case "ran": //  rand
                if (ref) this.variables.set(ref, rand(val))
                return rand(val)
            case "abs": //  absolute
                if (ref) this.variables.set(ref, absolute(val))
                return absolute(val)

        }
    }


    /**
     * @param {String} comparison logic comparison to make between input 1 and 2
     * @param {*} input1 string, number or variable reference
     * @param {*} input2 string, number or variable reference
     * @returns A bool based on logic and inputs
     */
    resolveLogic(comparison, input1, input2) {
        // if references, grab variable values
        if (this.variables.get(input1) != undefined) input1 = this.variables.get(input1)
        if (this.variables.get(input2) != undefined) input2 = this.variables.get(input2)

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
            case "or": // atleast one input == true (broke the 3 letter rule :O )
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
    completeOperations(instruction, args, scope) {
        let returnVal = instruction

        switch (instruction) {
            case "com": // comparison
                this.comparison(scope, args)
                break;
            case "brk": // break loop
                this.break(scope, args)
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
            case "style": // add colours and whatnot to console
                this.stylePrint(args)
                break; 
            case "run": // run functions
                returnVal = this.runFunction(args) 
                break;
            case "time": // Creates / updates benchmark
                returnVal = this.updateBenchmark(args) 
                break;

            case this.endOfLoopFlag: // end of loop (love this workaround)
                this.currentLine -= parseInt(args)
                break;
            case this.funcReturn: // end of function
                returnVal = this._return(args)
                break;
            // case "tic": // set tick rate
            //     this.setTickRate(args)
            //     break;
        }
        
        return returnVal
    }




    // _________________________ OPERATION FUNCTIONS _________________________



    /**
     * Skips lines equal to it's scope size
     * @param {Array} scope 
     */
    break(scope) {
        this.skipLines = scope.length
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
     * skipLines = scope.length
     * @param {Array} scope 
     * @param {String} args 
     */
    comparison(scope, args) { 

        if (args.match("false")) {
            this.skipLines = scope.length
        }
        return
    }


    /**
     * 
     * @param {String} args given strings to concatenate
     * @returns concatenated string
     */
    concatenate(args) {
        args = args.split(" ")

        // add extra spaces
        for (let i = 0; i < args.length; i++) {
            if (args[i] === "") args[i] = " "
        }

        // check to see if first argument is a variable that needs to be overwritten
        let origin = args[0]
        let reference = false
        if (this.variables.get(origin) !== undefined) {
            reference = origin
            args[0] = this.variables.get(reference)
        }
            
        args = args.join("")
        args = this.insertVariablesInString(args)

        if (reference) this.variables.set(reference, args)

        return args
    }


    /**
     * 
     * @param {String} args string which will be worked with and printed to the console
     * Prints to the console with the prefix - PROGRAM:
     */
    print(args) {
        args = this.insertVariablesInString(args)

        // I have no clue why formatting has to be like this but it just breaks otherwise :(
        let formatting = style.t_cyan + '%s' + this.backgroundStyling + this.textStyling + this.backgroundStyling 
        if (this.isBold) formatting += style.bold
        formatting += '%s' + style.reset

        console.log(formatting, "PROGRAM: ", args)
    }

    
    /**
     * Clears the console
     */
    clear() {
        console.clear()
    }


    /**
     * Styles the interpreters print function with given args
     * @param {String} args given colours and parameters to style the print withs
     * @returns 
     */
    stylePrint(args) {
        args = args.split(" ")

        const noStylingErr = {
            line: this.program[this.currentLine], 
        }
        if (args[0] === '') return this.error("No styling was given, if you want to reset the styling you can use the 'reset' or 'default' parameters", noStylingErr)

        let text = args[0]
        let background = args[1]
        let isBold = args[2]

        if (background === undefined) background = ""

        if (isBold === undefined) isBold = ""
        else if (isBold === '1' || isBold === 'true') this.isBold = true
        else if (isBold === '0' || isBold === 'false') this.isBold = false

        text = text.toLowerCase()
        background = background.toLowerCase()

        // heres where the magic happens baby
        // note: due to the actual console itself, some colours only show up
        // or don't show up due to the background colour
        if (text === 'black')   this.textStyling = style.t_black
        if (text === 'red')     this.textStyling = style.t_red
        if (text === 'green')   this.textStyling = style.t_green
        if (text === 'yellow')  this.textStyling = style.t_yellow
        if (text === 'blue')    this.textStyling = style.t_blue
        if (text === 'magenta') this.textStyling = style.t_magenta
        if (text === 'cyan')    this.textStyling = style.t_cyan  
        if (text === 'white')   this.textStyling = style.t_white
        if (text === 'gray')    this.textStyling = style.t_gray
        if (text === 'grey')    this.textStyling = style.t_gray
        if (text === 'reset')   this.textStyling = style.reset
        if (text === 'default') this.textStyling = style.reset
        
        if (background === 'black')     this.backgroundStyling = style.b_black
        if (background === 'red')       this.backgroundStyling = style.b_red
        if (background === 'green')     this.backgroundStyling = style.b_green
        if (background === 'yellow')    this.backgroundStyling = style.b_yellow
        if (background === 'blue')      this.backgroundStyling = style.b_blue
        if (background === 'magenta')   this.backgroundStyling = style.b_magenta
        if (background === 'cyan')      this.backgroundStyling = style.b_cyan  
        if (background === 'white')     this.backgroundStyling = style.b_white
        if (background === 'gray')      this.backgroundStyling = style.b_gray
        if (background === 'grey')      this.backgroundStyling = style.b_gray
        if (background === 'default')   this.backgroundStyling = style.reset
        if (background === 'reset')     this.backgroundStyling = style.reset
    }


    /**
     * Searches for the given function name in stored functions
     * the overwrites the currentLine to that function
     * Then runs function in sandbox
     * @param {String} functionName name of the function
     */
    runFunction(functionName) {
        // store the line the function call is on and the function name in functionPath
        let pathObj = {
            parent: functionName,
            line: this.currentLine // line is used to backtrack after function is complete
        }
        this.functionPath.push(pathObj)

        // get function object which has location and return value
        let func = this.storedFunctions.get(functionName)
        this.currentLine = func.index - 1
        
        // run function in a sandbox to get return value (note, this doesn't account for tickrates!)
        while (1) {
            let line = this.program[this.currentLine]

            if (this.skipLines === 0) this.interpretLine(line)
            else this.skipLines--
            
            if (line.startsWith("rtn") && this.skipLines === 0) {
                break;
            }

            this.currentLine++
        }
        
        return func.returnValue
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
        func.returnValue = this.checkIfStringIsNumber(args)

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
            return Date.now() - benchmark
        }
        // create benchmark
        else {
            this.benchmarkers.set(label, Date.now())
        }
    }


     /**
     * Reads in variables that are encompassed in [], 
     * or returns the array given as a string
     * 
     * Also works for numbers
     * @param {Array} args 
     * @returns {String | Number} 
     */
     readVariables(args) {   
        if (typeof args === 'string') {
            args = args.split(" ") 
        }

        if (args === undefined) args = [""]

        let x = ""
        for (let i = 0; i < args.length; i++) {
            let arg = args[i]

            // add variables to string with [x]
            if (arg.startsWith(this.readStart) && arg.endsWith(this.readEnd)) {
                arg = arg.slice(1, arg.length-1)
                if (this.variables.get(arg) != undefined) x += this.variables.get(arg) + " "
                if (this.constants.get(arg) != undefined) x += this.constants.get(arg) + " "
            }
            // else just add to string
            else x += arg + " "
        }

        x = x.slice(0, x.length-1)

        if (parseFloat(x)) x = parseFloat(x)
        return x
    }




    // _________________________ STRING FUNCTIONS _________________________



    /**
     * 
     * @param {String} string string input which will be matched against existing variables and constants
     * @returns Given string parameter after replacing variables / constants
     */
    insertVariablesInString(string) {
        let rs = this.readStart
        let re = this.readEnd

        // constants
        for (let constant of this.constants.keys()) {
            // the while loop checks to see if the string would change 
            // if another replace was done, 
            // this makes sure that prn [x] [x], replaces ALL [x] and not just the first one
            while (string !== string.replace(rs + constant + re, this.constants.get(constant))) {
                string = string.replace(rs + constant + re, this.constants.get(constant))
                string = this.insertVariablesInString(string) // recursively solve strings within strings
            }
        }

        // variables
        for (let variable of this.variables.keys()) {
            while (string !== string.replace(rs + variable + re, this.variables.get(variable))) {
                string = string.replace(rs + variable + re, this.variables.get(variable))
                string = this.insertVariablesInString(string) // recursively solve strings within strings
            }
        }

        return string
    }


    /**
     * checks to see if a string should be a number
     * @param {String} val 
     * @returns 
     */
    checkIfStringIsNumber(val) {
        if (parseFloat(val).toString().length === val.length && !isNaN(parseFloat(val))) {
            return parseFloat(val)
        }
        return val
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
     * Prints stored _Interpreter variables, functions and timers.
     * Doesn't print constants
     */
    printVariables() {
        let formatting = style.t_cyan + '%s' + style.reset
        console.log(formatting, "\n\nvar: ", this.variables)
        console.log(formatting, "\nfunctions: ", this.storedFunctions)
        console.log(formatting, "\nbenchmarkers: ", this.benchmarkers)
    }


    /**
     * 
     * @param {String} errorMsg message that describes the error
     * @param {Object} errorObj extra debug information relating to the error
     * @returns 
     */
    error(errorMsg, errorObj) {
        // if no defined errorObj, turn into string
        errorObj = (errorObj !== undefined)? errorObj : " " 

        let formatting = style.t_red + '%s ' + style.reset
        return console.log(formatting, "ERROR - " + errorMsg + "\n", errorObj, "\n")
    }


    /**
     * Exits the program
     * @param {string} msg Optional message that displays when the program exits
     */    
    exitProgram(msg) {
        msg = this.insertVariablesInString(msg)

        let formatting = style.t_yellow + style.bold + '%s' + style.reset
        console.log(formatting, "\nPROGRAM EXITED:", msg)

        this.running = false
    }
} 