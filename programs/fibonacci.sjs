num fibAmount = 13
 
fnc fibonacci {
    num x = [y]
    num y = [z]
    num z = (add [x] y)
}

num x = 0
num y = 1
num z = 0

for (num i = 0, lst i fibAmount, add i 1) {
    run fibonacci
    prn [z]
}

