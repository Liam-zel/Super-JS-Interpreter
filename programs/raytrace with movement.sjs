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


inp (input) {

    * movement
    com (equ input w) {
        sub y speed
    }
    com (equ input a) {
        sub x speed
    }
    com (equ input s) {
        add y speed
    }
    com (equ input d) {
        add x speed
    }

    * looking
    com (equ input q) {
        sub facing 5
    }
    com (equ input e) {
        add facing 5
    }

    * ext
    com (equ input z) {
        ext
    }
}


* ----- Character Variables -----
num x = 10
num y = 10
num speed = 0.15
str character = O
num facing = 0 * measured in angles going clockwise. 0 is NORTH 
sub facing 90

* ----- Ray Tracing Variables -----
num screenWidth = 70    * def: 70
num screenHeight = 19   * def: 21

num FOV = 70    * def: 70

num rayLength = 11  * def: 11

num charsPerRay = (div [screenWidth] FOV)

* grayScale:  $@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`'. 
*arr distChars = $,@,8,&,%,o,a,d,p,w,m,-,_,+,~,<,>,i,!,l,I
arr distChars = [SPACE], @,#,%,o,?,|,l,+,π,-,…,[SPACE]



* turn map into 2d array
num height = 12
num width = 12

arr 2dMap
arr mapSlice 

fnc create2dMap {
    for (num i = 0, lst i width, add i 1) {
        for (num j = 0, lst j height, add j 1) {
            num index = (add (mul [j] width) i)
            str mapChar = [map:index]
            mov mapSlice [mapChar]
        }

        mov 2dMap [mapSlice]
        arr mapSlice
    }
}

run create2dMap

arr empty2D

* -- create empty 2d screen array --
* Initialise screen array (slow)
fnc createEmpty2D {
    str char = [SPACE]

    for (num i = 0, lst i screenHeight, add i 1) {
        arr screenSlice = [char]
        for (num j = 1, lst j screenWidth, add j 1) {
            mov screenSlice [char]
        }

        com (equ i (rnd (div [screenHeight] 2))) {
            str char = .
        }
        mov empty2D:i [screenSlice]
    }
}

run createEmpty2D

fnc drawMap {
    str screenSlice = [NEWLINE]

    for (num i = 0, lst i height, add i 1) {
        for (num j = 0, lst j width, add j 1) {
            str char = [2dMap:j:i]

            com (and (equ j (flr [x])) (equ i (flr [y]))) {
                str char = O
            }


            con screenSlice [char] [SPACE]
        }
        con screenSlice [NEWLINE]
    }

}


* ----- Ray tracing begin -----

for (num step = 0, grt step -1, add step 0) {

    time test
    run InitialiseScreen
    run rayTrace
    run getScreenString
    clr
    run drawScreen
    run drawMap
    prn (time test)ms
    prn (rnd (div 1000 (time test)))fps
    del test

    add facing 0
}


fnc getScreenString {
    str screenString = [NEWLINE]
    for (num i = 0, lst i screenHeight, add i 1) {
        str row = (join [screen:i])
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

    * --- EXPLANATION ---
    * https://editor.p5js.org/bigman16/sketches/6TFVLC1q_ 
    * lol theres no explanation just go to the link

    num startAngle = (add -(div [FOV] 2) facing)
    num endAngle = (add (div [FOV] 2) facing)

    for (num angle = [startAngle], lst angle endAngle, add angle 1) {

        num xDir = (cos [angle])
        num yDir = (sin [angle])

        for (num depth = 1, lst depth rayLength, add depth 1) {

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

                str wallChar = [distChars:depth]

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

    del castRays
}