* --- character ---
str char = O
num x = 2
num y = 2

num xDir = 0
num yDir = 0

* --- boxes ---
arr boxes 
fnc createBoxes {
    num wi = (sub [width] 4)
    num he = (sub [height] 4)

    num boxX = (add (flr (mul (ran) wi)) 2)
    num boxY = (add (flr (mul (ran) he)) 2)

    num pos = [2dMap:boxX:boxY]

    com (and (equ boxX x) (equ boxY y)) {
        run createBoxes
        rtn
    }
    com (equ pos #) {
        run createBoxes
        rtn
    }
    com (equ pos $) {
        run createBoxes
        rtn
    }

    arr box = [boxX], [boxY]

    mov boxes [box]
    set 2dMap:boxX:boxY @
}

fnc moveBox {
    num c_boxX = boxes:chosenBox:0
    num c_boxY = boxes:chosenBox:1

    set 2dMap:c_boxX:c_boxY .

    add c_boxX xDir
    add c_boxY yDir

    str futureChar = [2dMap:c_boxX:c_boxY]

    com (or (equ futureChar #) (equ futureChar @)) {
        sub c_boxX xDir
        sub c_boxY yDir 

        set 2dMap:c_boxX:c_boxY @

        rtn 0
    }
    com (equ futureChar $) {
        set boxes:chosenBox collected
        rtn 1
    }


    set 2dMap:c_boxX:c_boxY @

    arr newBoxPos = [c_boxX], [c_boxY]

    set boxes:chosenBox newBoxPos
    rtn 1
}

* --- goal ---
str goal = $
num goalX
num goalY 

fnc initGoal {
    num wi = (sub [width] 4)
    num he = (sub [height] 4)

    num goalX = (add (flr (mul (ran) wi)) 2)
    num goalY = (add (flr (mul (ran) he)) 2)

    set 2dMap:goalX:goalY [goal]
}

inp (key) {

    com (equ key w) {
        num yDir = -1
        num xDir = 0
    }
    com (equ key a) {
        num yDir = 0
        num xDir = -1
    }
    com (equ key s) {
        num yDir = 1
        num xDir = 0
    }
    com (equ key d) {
        num yDir = 0
        num xDir = 1
    }

    com (equ key z) {
        ext
    }
}

* --- map ---
span
arr map = 
    #,#,#,#,#,#,#,#,#,#,#,#,
    #,.,.,.,.,.,.,.,.,.,.,#,
    #,.,.,#,#,#,#,#,#,.,.,#,
    #,.,.,#,.,.,.,.,#,.,.,#,
    #,.,.,#,.,.,.,.,#,.,.,#,
    #,.,.,#,.,.,.,.,#,.,.,#,
    #,.,.,#,#,#,.,.,#,.,.,#,
    #,.,.,#,.,.,.,.,#,.,.,#,
    #,.,.,#,.,.,.,.,#,.,.,#,
    #,.,.,.,.,.,.,.,.,.,.,#,
    #,.,.,.,.,.,.,.,.,.,.,#,
    #,#,#,#,#,#,#,#,#,#,#,#
span

num height = 12
num width = 12

arr 2dMap 
arr mapSlice

for (num i = 0, lst i width, add i 1) {
    for (num j = 0, lst j height, add j 1) {
        num index = (add (mul [j] width) i)
        str mapChar = [map:index]
        mov mapSlice [mapChar]
    }

    mov 2dMap [mapSlice]
    arr mapSlice
}

* --- game ---
run initGoal
run createBoxes
run createBoxes

for (num i = 0, grt i -1, add i 0) {
    run updatePlayer
    clr
    run runGame

    com (equ (run checkWin) 1) {
        prn YOU WIN
        ext
    }
}


fnc updatePlayer {
    num futureX = (add [x] xDir)
    num futureY = (add [y] yDir)

    str futureChar = [2dMap:futureX:futureY]

    com (or (equ futureChar #) (equ futureChar $)) {
        rtn
    }

    num canMove = 1

    com (equ futureChar @) {
        for (num i = 0, lst i (len boxes), add i 1) {
            com (and (equ boxes:i:0 futureX) (equ boxes:i:1 futureY)) {
                num chosenBox = [i]
                num canMove = (run moveBox)

                brk
            }
        }
    }

    com (equ canMove 0) {
        rtn 
    }

    set 2dMap:x:y .

    add x xDir
    add y yDir

    set 2dMap:x:y [char]

    num xDir = 0
    num yDir = 0
}

fnc runGame {
    str screenString = [NEWLINE]

    for (num i = 0, lst i width, add i 1) {
        for (num j = 0, lst j height, add j 1) {
            con screenString [2dMap:j:i] [SPACE]
        }
        con screenString [NEWLINE]
    }

    prn [screenString]
}

fnc checkWin {
    for (num i = 0, lst i (len boxes), add i 1) {
        com (neq boxes:i collected) {
            rtn 0
        }
    }

    rtn 1
}