prn start

fnc printHiTwice {
    prn hi
    prn hi
}

run printHiTwice

com (equ hi hi) {
    prn no way, hi === hi??
}

for (num i = 0, lst i 2, add i 1) {
    prn [i]
}
for (num i = 0, lst i 3, add i 1) {
    for (num j = 0, lst j 3, add j 1) {
        for (num k = 0, lst k 3, add k 1) {
            com (equ k 1) {
                prn k IS 1 !!
            }
        }
    }
}

prn start