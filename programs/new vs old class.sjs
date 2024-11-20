
* old ~23,500ms
* less old ~24,200ms
* new ~230ms
fnc concatenateTest {
    str x = Hello mr.

    for (num i = 0, lst i 50000, add i 1) {
        con x [i] [i]
    }
}


* old ~290ms
* less old ~340ms
* new ~185ms
fnc createVar {
    for (num i = 0, lst i 50000, add i 1) {
        num x = 1
    }
}


* old ~805
* less old ~1000
* new ~740ms
fnc bracketsTest {
    num x = 1
    
    for (num i = 0, lst i 100000, add i 1) {
        add x (add (add (add (add 1 (add 1 1)) 1) 1) 1)
    }

    prn [x]
}


* old ~1680ms
* less old ~1720ms
* new ~920ms
fnc findQuotientAndRemainder {
    for (num i = 0, lst i 100000, add i 1) {
        num x = [i]
        num divisor = 10

        num quotient = (flr (div [x] divisor))
        num remainder = (mod [x] divisor)
    }
}  



* old ~1360
* old ~1450
* new ~580
fnc printStuff {
    for (num i = 0, lst i 100000, add i 1) {
        str stuff = [SPACE] [SPACE] [TAB] [NULL] [UNDEFINED]
    }
}

run concatenateTest