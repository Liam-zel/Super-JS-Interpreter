span
arr c = (col red red), (col yellow yellow), (col green green),
        (col blue blue), (col cyan cyan)

span
col default default true

num width = 70
num height = 21

num counter = 0

num loopCount = 0

for (num inf = 0, grt inf -1, add inf 0) {
    str screen = [NEWLINE]

    time t

    for (num i = 0, lst i height, add i 1) {
        str screenSlice

        for (num j = 0, lst j width, add j 1) {
            num colIndex = (mod [counter] (len [c]))
            add counter 1

            con screenSlice .[c:colIndex][SPACE]
        }

        con screen [screenSlice] [NEWLINE]
    }

    add counter 1
    add loopCount 1

    clr
    prn [screen]

    prn (time t)ms
    prn (rnd (div 1000 (time t)))fps
    del t

    com (equ loopCount 900) {
        ext
    }
}