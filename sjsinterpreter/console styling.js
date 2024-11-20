class Style {
    constructor() {
        // text formatting
        this.t_black     = '\x1b[30m'
        this.t_red       = '\x1b[31m'
        this.t_green     = '\x1b[32m'
        this.t_yellow    = '\x1b[33m'
        this.t_blue      = '\x1b[34m'
        this.t_magenta   = '\x1b[35m'
        this.t_cyan      = '\x1b[36m'
        this.t_white     = '\x1b[37m'
        this.t_gray      = '\x1b[90m'  

        // background formatting
        this.b_black     = '\x1b[40m'
        this.b_red       = '\x1b[41m'
        this.b_green     = '\x1b[42m'
        this.b_yellow    = '\x1b[43m'
        this.b_blue      = '\x1b[44m'
        this.b_magenta   = '\x1b[45m'
        this.b_cyan      = '\x1b[46m'
        this.b_white     = '\x1b[47m'
        this.b_gray      = '\x1b[100m'

        this.reset       = '\x1b[0m' // reset to default style
        this.bold        = '\x1b[1m' // bold characters
    }
} 

export const style = new Style()

// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color 
// note: the string (second parameter) is inserted at %s, 
// the \x1b[0m after resets the console back to its default
// let x = {msg: "hi"}
// console.log('\x1b[30m%s %s\x1b[0m', "Program Exited", x) // text black
// console.log('\x1b[31m%s %s\x1b[0m', "Program Exited", x) // text red
// console.log('\x1b[32m%s %s\x1b[0m', "Program Exited", x) // text green
// console.log('\x1b[33m%s %s\x1b[0m', "Program Exited", x) // text yellow
// console.log('\x1b[34m%s %s\x1b[0m', "Program Exited", x) // text blue
// console.log('\x1b[35m%s %s\x1b[0m', "Program Exited", x) // text magenta
// console.log('\x1b[36m%s %s\x1b[0m', "Program Exited", x) // text cyan
// console.log('\x1b[37m%s %s\x1b[0m', "Program Exited", x) // text white
// console.log('\x1b[90m%s %s\x1b[0m', "Program Exited", x) // text gray

// console.log('\x1b[40m%s %s\x1b[0m', "Program Exited", x) // background black
// console.log('\x1b[41m%s %s\x1b[0m', "Program Exited", x) // background red
// console.log('\x1b[42m%s %s\x1b[0m', "Program Exited", x) // background green
// console.log('\x1b[43m%s %s\x1b[0m', "Program Exited", x) // background yellow
// console.log('\x1b[44m%s %s\x1b[0m', "Program Exited", x) // background blue
// console.log('\x1b[45m%s %s\x1b[0m', "Program Exited", x) // background magenta
// console.log('\x1b[46m%s %s\x1b[0m', "Program Exited", x) // background cyan
// console.log('\x1b[47m%s %s\x1b[0m', "Program Exited", x) // background white
// console.log('\x1b[100m%s %s\x1b[0m',"Program Exited", x) // background gray
    