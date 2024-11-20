* ==== VARIABLES ====
str equation
str string
inpType 3

* ==== INPUT ====
inp (key) {
    str char = (utf [key])

    num isKey = 0

    * 7f = backspace
    com (equ key 7f) { 
        del string:(sub (len string) 1)
        num isKey = 1
    }

    * 0d = enter
    com (equ key 0d) {
        set equation [string]
        str string
        prn equation: [equation]
    }

    com (neq isKey 1) {
        con string [char]
    }


    * 5c = '\'
    com (equ key 5c) {
        clr
        ext
    }

    prn [string]
}

* ==== INITIALISE GRAPH ====
num width = 45
num height = 21
num lineSpacing = 4
arr graph2D

run initialiseGraph

fnc initialiseGraph {
    for (num x = 0, lst x width, add x 1) {
        arr column

        for (num y = 0, lst y height, add y 1) {

            str char = [SPACE]

            com (equ (mod [y] lineSpacing) 0) {
                str char = -
            } 
            com (equ (mod [x] lineSpacing) 0) {
                str char = |
            }             
            com (and (equ (mod [y] lineSpacing) 0) (equ (mod [x] lineSpacing) 0)) {
                str char = +
            } 
            
            mov column [char]
        }

        mov graph2D [column]

    }

}

* ==== UPDATE GRAPH ====
fnc updateGraph {

}

* ==== DRAW GRAPH ====
fnc drawGraph {
    for (num y = 0, lst y height, add y 1) {
        str row

        for (num x = 0, lst x width, add x 1) {
            con row [graph2D:x:y]
        }

        prn [row]
    }
}


* ==== DRAW LOOP ====
for (num i = 0, lst i 1, add i 0) {
    com (neq equation EMPTYCHAR) {
        clr

        run drawGraph
    }
}
