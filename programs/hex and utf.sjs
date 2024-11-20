str x = hello
str y = 73 *s

arr hexes = 73, 7373, 737373
arr strings = hi, hello, hey

prn hex:
prn (hex [strings:1])
prn hi:     (hex hi)
prn hello:  (hex hello)
prn hey:    (hex hey) 

*prn utf:
*prn (utf [hexes:1])
*prn (utf [y])