* good looking parallax map
span
arr map = 
    #,#,#,#,#,#,#,#,#,#,#,#,
    #,_,#,_,#,_,#,_,#,_,#,#,
    #,_,_,_,#,_,#,_,_,_,_,#,
    #,_,#,_,#,_,#,_,#,_,#,#,
    #,_,_,_,#,_,#,_,_,_,_,#,
    #,_,#,_,#,_,#,_,#,_,#,#,
    #,_,_,_,#,_,#,_,_,_,_,#,
    #,_,#,_,#,_,#,_,#,_,#,#,
    #,_,_,_,_,_,_,_,_,_,_,#,
    #,_,#,_,#,_,#,_,#,_,#,#,
    #,_,_,_,_,_,_,_,_,_,_,#,
    #,#,#,#,#,#,#,#,#,#,#,#
span
span
arr path = 
    -1,  0, -1,  0,
    -1,  0, -1,  0,
    -1,  0, -1,  0,
    -1,  0, -1,  0,
    -1,  0,  0, -1,
     0, -1,  1,  0,
     1,  0,  1,  0,
     1,  0,  1,  0,
     1,  0,  1,  0,
     1,  0,  0,  1,
     0,  1,  1,  0

span


* ----- Character Variables -----
num x = 10
num y = 10
num speed = 0.05
str character = O
num facing = 0 * measured in angles going clockwise. 0 is NORTH 
sub facing 90

* ----- Ray Tracing Variables -----
num screenWidth = 70    * def: 70
num screenHeight = 21   * def: 21

num FOV = 70    * def: 70

num rayLength = 11  * def: 11

num charsPerRay = (div [screenWidth] FOV)

* grayScale:  $@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`'. 
*arr distChars = $,@,8,&,%,o,a,d,p,w,m,-,_,+,~,<,>,i,!,l,I
arr distChars = @,#,%,o,?,|,l,+,π,-,…,[SPACE]
span
arr distColours = 
    (col black white true), (col black white true),
    (col white gray true), (col white gray true),
    (col cyan reset true), (col cyan reset true), 
    (col blue reset false), (col blue reset false), 
    (col gray reset false), (col gray reset false), 
    (col black reset false), (col black reset false)
span
col reset reset false



* ----- Pre calculated -----
arr finalScreens
arr finalPositions


* turn map into 2d array
num height = 12
num width = 12

arr 2dMap 
arr mapSlice

for (num i = 0, lst i width, add i 1) {
    for (num j = 0, lst j height, add j 1) {
        num index = (add (mul [j] width) i)
        str mapChar = [map:index]
        mov mapSlice [mapChar]
    }

    mov 2dMap [mapSlice]
    arr mapSlice
}

* -- create empty 2d screen array --
arr empty2D

* Initialise screen array (slow)
str char = (col reset reset false)[SPACE]

for (num i = 0, lst i screenHeight, add i 1) {

    arr screenSlice = [char]
    for (num j = 1, lst j screenWidth, add j 1) {
        mov screenSlice [char]
    }

    com (equ i (rnd (div [screenHeight] 2))) {
        str char = (col reset reset false).
    }
    mov empty2D:i [screenSlice]
}


fnc updateCharacter {
    set 2dMap:x:y .

    add x (mul [path:step] speed)
    
    add y (mul [path:(add [step] 1)] speed)

    * truncate after 2 digits
    mul x 100
    mul y 100
    rnd x
    rnd y
    div x 100
    div y 100

    set 2dMap:x:y [character]
}


fnc drawMap {
    str screenSlice = [NEWLINE]

    for (num i = 0, lst i height, add i 1) {
        str row = (join 2dMap:j)
        con screenSlice [row] [SPACE] [NEWLINE]
    }

    prn [screenSlice]
}


* ----- Ray tracing begin -----

num subStep = 0
num subStepsPerStep = (div 1 speed)
num blah = 0
for (num step = 0, grt step -1, add step 0) {

    com (gte step (len path)) {
        num step = 0
    }

    run updateCharacter
    
    add subStep 1
    com (equ subStep subStepsPerStep) {
        num subStep = 0
        add step 2
    }

    time test
    run InitialiseScreen
    run rayTrace
    run getScreenString
    clr
    run drawScreen
    *run drawMap
    prn (time test)ms
    prn (rnd (div 1000 (time test)))fps
    del test

    add facing 0
    add blah 1

    for (num i = 0, lst i 3300, add i 1) {

    }

    com (equ blah 7500) {
        ext
    }
}


fnc getScreenString {
    str screenString = [NEWLINE]
    for (num i = 0, lst i screenHeight, add i 1) {
        str row = (join [screen:i] (col reset reset false))
        con screenString [row] [NEWLINE]
    } 
}

fnc drawScreen {
    prn [screenString]
}

fnc InitialiseScreen {
    arr screen

    set screen empty2D
}


fnc rayTrace {
    num stepOffset = (mul (div [step] 2) subStepsPerStep)
    num substepOffset = (sub [subStep] 2)

    num index = (add [stepOffset] substepOffset)

    com (equ (len finalPositions) 440) {
        add index 1

        com (and (equ x [finalPositions:index:0]) (equ y [finalPositions:index:1])) {
            set screen finalScreens:index
            rtn
        }
    }


    * --- EXPLANATION ---
    * https://editor.p5js.org/bigman16/sketches/6TFVLC1q_ 
    * lol theres no explanation just go to the link

    num startAngle = (add -(div [FOV] 2) facing)
    num endAngle = (add (div [FOV] 2) facing)

    for (num angle = [startAngle], lst angle endAngle, add angle 1) {

        num xDir = (cos [angle])
        num yDir = (sin [angle])

        for (num depth = 0, lst depth rayLength, add depth 1) {
            num xOff = (mul [xDir] depth)
            num yOff = (mul [yDir] depth)
            
            num newX = (rnd (add [x] xOff))
            num newY = (add [y] yOff)

            * out of bounds (~3ms cost from just these if statements bruh)
            com (or (gte newX width) (lst newX 0)) {
                brk
            }
            com (or (gte newY height) (lst newY 0)) {
                brk
            }

            str rayHit = [2dMap:newX:newY]

            com (equ rayHit #) {
                num angleFromZero = (sub [angle] startAngle)

                num wallX = (mul [angleFromZero] charsPerRay)

                num wallHeight = (div [screenHeight] (pow [depth] 0.66))
                num centreY = (div [screenHeight] 2)
                num wallY = (sub [centreY] (div [wallHeight] 2))

                str wallChar = [distColours:depth][distChars:depth]

                * draw wall
                for (num i = [wallX], lst i (add [charsPerRay] wallX), add i 1) {
                    for (num j = [wallY], lst j (add [wallY] wallHeight), add j 1) {
                        set screen:j:i [wallChar]
                    }
                }
        
                brk
            }

        }

    }

    mov finalScreens [screen]
    arr positions = [x], [y], [facing]
    mov finalPositions [positions]
    del castRays
}