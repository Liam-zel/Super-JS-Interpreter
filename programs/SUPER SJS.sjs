inpType 3

inp (key) {
    
}

str x = hello!
prn (len x)
prn test

for (num i = 0, grt i -1, add i 0) {

}




* go to register x: >x
* get value at register x: <x
* change register to x: =x
* print value at register x: $x
* string value x: /x/

* go to label x: !x
* define label x: .x

* if register equals x, then go to label y: ?10,y

* x + y: x+y

* spaces not in between / / are excluded

* prints "hello world!" 5 times
* e.g  >2=0 .start >0=/hello/ >1=/ world!/ >0=<0+<1 $0 >2=<2+1 ?5,end !start .end