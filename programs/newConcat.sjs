str x = #
arr y = 1,2,3

str z = 1:1

con x [SPACE] [x] hello [y:1] [z]


time test
for (num i = 0, lst i 33000, add i 1) {
    con x [SPACE] [x] [x] hello
    str x = # 
}

prn (time test)ms