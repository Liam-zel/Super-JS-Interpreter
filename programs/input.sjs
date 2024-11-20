num totalKeyPresses = 0

inp (input) {
    com (equ input a) {
        prn you pressed a
    }
    com (equ input z) {
        ext
    }

    add totalKeyPresses 1

    prn [totalKeyPresses]
}

for (num i = 0, lst i 100000000000, add i 1) {

}