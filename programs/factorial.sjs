num input = 170
num sum = [input]

*time x
for (num i = (sub [input] 1), grt i 1, sub i 1) {
    mul sum i
}

*prn (time x)ms

*prn [sum]