export default class programLineByLine {
    constructor(delay, lineAmount) {
        this.delay = delay || 1000
        this.lineAmount = lineAmount || 10

        this.currentLine

        this.program

        this.skipLines = 0

        this.scopeStart = "{"
        this.scopeEnd = "}"

        this.endOfLoopFlag = "endLoop"
    }

    setup(Interpreter) {
        this.program = Interpreter.programCast()
        this.currentLine = Interpreter.functionLines
    }

    run() {
        setInterval(() => this.printLines(), this.delay)
    }

    printLines() {
        console.clear()
        let start = this.currentLine - this.lineAmount/2
        let end = this.currentLine + this.lineAmount/2

        for (let i = start; i < end; i++) {

            let line = this.program[i]

            if (i < 0 || i > this.program.length) {
                console.log("*")
                continue
            }

            if (line == undefined) line = ""
            if (line.length > 35) line = line.slice(0, 33) + "..."

            if (this.program[i-1] !== undefined) {
                if (this.program[i-1].indexOf(this.scopeStart) !== -1) {
                    line = "\t" + line
                }
            }

            if (i !== this.currentLine) {
                console.log(`${i}  \t${line}`)
                continue
            }

            if (line.startsWith("brk") || line.startsWith("com")) {
                this.setSkipLines(line)
            }

            // set current char based off program flow
            let currentLineChar
            if (this.skipLines === 0) currentLineChar = ">"
            else {
                // this.skipLines--
                this.currentLine += this.skipLines
                this.skipLines = 0
                currentLineChar = "|"
            }
                

            if (line.startsWith(this.endOfLoopFlag)) {
                let instruction = line.split(" ")[0]
                this.currentLine -= parseInt(line.slice(line.indexOf(instruction) + instruction.length).trim())
                currentLineChar = "^"
            }

            console.log(`${i} ${currentLineChar}\t${line}`)
        }
        this.currentLine++
    }

    setSkipLines(line) {
        let l = line.split(" ")
        let label = l[l.length-1]
        if (label.startsWith(this.scopeStart)) label = label.slice(1)

        let start = this.currentLine
        let end = this.program.indexOf(this.scopeEnd + label, this.currentLine)

        this.skipLines = end - start
    }
}