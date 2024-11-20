arr x = 1,2,3
arr y = 4,5,6

arr 2d = [x], [y]

str wall = #
str floor = _

*del 2d:1:2
*mov 2d:1:2 [wall]
*del 2d:1:1
*mov 2d:1:1 [floor]
set 2d:1:2 [wall]
set 2d:1:1 [floor]

str wall = |

set 2d:1:0 [wall]
*del 2d:1:0
*mov 2d:1:0 [wall]

prn 0:  [2d:0]
prn 1:  [2d:1]
prn 2:  [2d:2]