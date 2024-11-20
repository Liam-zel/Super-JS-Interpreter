* ----- character -----
num x = 5
num y = 10
num jumpVel = 0.5

* ----- physics -----
num yVel = 0
num gravity = 0.01

num height = 40


inp (input) {
    com (equ input SPACE) {
        num yVel = (mul [jumpVel] -1)
    }
}

fnc updateBird {
    add y yVel
    add yVel gravity

    com (grt y height) {
        num y = height
    }
}

fnc drawBird {
    str bird

    com (lst y 0) {
        prn
        rtn
    }

    for (num j = 0, lst j y, add j 1) {
        con bird [NEWLINE]
    }

    for (num i = 0, lst i x, add i 1) {
        con bird [SPACE]
    }

    con bird O
    prn [bird]
}

for (num i = 0, grt i -1, add i 1) {
    run updateBird
    clr
    run drawBird
}