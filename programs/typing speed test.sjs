* ============ VARAIBLES ============
str space = @

span
arr promptArr = t,h,e,[space],q,u,i,c,k,[space],b,r,o,w,n,[space],f,o,x,[space],j,u,m,p,e,d,
                [space],o,v,e,r,[space],t,h,e,[space],l,a,z,y,[space],d,o,g
span
arr wasCorrect

str unTypedCol = (col gray)
str correctCol = (col green)
str incorrectCol = (col red)
str currentCol = (col white)

col reset reset

num currentCharIndex = 0

str incorrect = 0
str correct = 1
str untyped = 2

num errors = 0


* ============ SETUP ============

for (num i = 0, lst i (len promptArr), add i 1) {
    mov wasCorrect [untyped]
}


* ============ INPUT ============

inp (x) {
    str currentChar = [promptArr:currentCharIndex]

    com (equ x currentChar) {
        set wasCorrect:currentCharIndex 1
    }

    com (equ wasCorrect:currentCharIndex 2) {
        set wasCorrect:currentCharIndex 0
        add errors 1
    }

    * exit key
    com (equ x \) {
        ext
    }

    add currentCharIndex 1
}


* ============ GAME LOOP ============
time timer

for (num i = 0, lst i 1, add i 0) {

    clr
    run printCharacters
    run checkWon

    num timeTaken = (time timer)
    num timeTakenInMs = (rnd (div [timeTaken] 100))
    prn (div [timeTakenInMs] 10)s
}


* ============ FUNCTION ============
fnc printCharacters {
    str characterLine

    for (num j = 0, lst j (len promptArr), add j 1) {
        con characterLine (col reset reset)

        str char = [promptArr:j]
        num isSpace = 0

        com (equ char space) {
            con characterLine [SPACE]
            str char = [EMPTYCHAR]
            *num isSpace = 1
        }

        str charState = [wasCorrect:j]

        str colour
        str background

        com (equ charState 0) {
            str colour = [incorrectCol]

            com (equ isSpace 1) {
                str background = (col reset red)
            }
        }

        com (equ charState 1) {
            str colour = [correctCol]
            
            com (equ isSpace 1) {
                str background = (col reset green)
            }
        }

        com (equ charState 2) {
            str colour = [unTypedCol]
        }

        com (equ j currentCharIndex) {
            str colour = [currentCol]
        }

        con characterLine [background] [colour] [char]
    }

    prn [characterLine]
}


fnc checkWon {
    com (gte currentCharIndex (len promptArr)) {
        num timeTaken = (time timer)
        num seconds = (div timeTaken 100)
        rnd seconds
        div seconds 10

        str stats = [NEWLINE]

        num words = (div (sub (len promptArr) 1) 5)
        num WPM = (mul (div [words] seconds) 60)
        rnd WPM

        num accuracy = (sub 1 (div [errors] (len promptArr)))
        mul accuracy 100
        rnd accuracy

        con stats WPM: [SPACE] [WPM]wpm
        con stats [NEWLINE]
        con stats TIMETAKEN: [SPACE] [seconds]s
        con stats [NEWLINE]
        con stats ACCURACY: [SPACE] [accuracy]%

        ext YOU WON! [stats]
    }
}