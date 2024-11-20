* fibonacci
* instructor: 47.22s
* sjs: 0.18s
* sjs with input: 10.34s

* simple math
* instructor: 47.22s
* sjs: 0.025s
* sjs with input: 5.6s

inp (input) {

}

fnc operations {
    add x 1
    sub x 1
    mul x 1
    div x 1
    mod x 2
    pow x 1
}

num x = 1

for (num i = 0, lst i 1000, add i 1) {*
    run operations
}
