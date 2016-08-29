/**
 * Created by kenneth on 8/29/16.
 */

var misc = require('./misc');
var que = require('./queue');

console.log("Adding %d to 10 gives us %d", misc.x, 42);
console.log("Adding %d to 10 gives us %d", misc.x, misc.addX(10));

var s = new que.Stack(0,1), e;
s.push(2);
console.log(s.getLength()); // 3
while(undefined!==(e=s.pop()))
    console.log('cooler '+e); // 2, 1, 0