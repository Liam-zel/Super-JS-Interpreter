num max = 100

for (num i = 0, lst i max, add i 1) {
    num result = (add [i] 1)
    str printString

    num isFizzedOrBuzzed = 0

    com (equ (mod [result] 3) 0) {
        num isFizzedOrBuzzed = 1
        con printString fizz
    }
    com (equ (mod [result] 5) 0) {
        num isFizzedOrBuzzed = 1
        con printString buzz
    }

    com (equ isFizzedOrBuzzed 0) {
        str printString = [result]
    }

    prn [printString]
}