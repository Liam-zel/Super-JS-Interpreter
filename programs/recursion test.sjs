num x = 1
num exp = 1023

fnc recursion {
    mul x 2
    com (grt x (pow 2 exp)) {
        ext [x]
        prn (pow 2 exp)
        prn (time t)ms
        rtn
    }

    run recursion
}

time t
run recursion