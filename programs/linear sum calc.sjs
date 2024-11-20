num initialVal = 1
num increaseAmt = 21
num increaseMult = 1.00

num current = 29800


num total = [initialVal]
for (num i = 1, lte i current, add i 1) {
    com (grt increaseAmt 0) {
        add total (add [i] increaseAmt)
    }

    com (neq increaseMult 1) {
        add total (pow [increaseMult] i)
    }
} 

*prn starting from [initialVal] and increasing by [increaseAmt] til the current [current]:
prn total is: [total]