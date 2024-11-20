num x = 1

fnc printX {

    com (equ x 0) {
        rtn [x] is 0
    }
    rtn no
}


prn (run printX)