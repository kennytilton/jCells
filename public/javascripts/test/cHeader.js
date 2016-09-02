/**
 * Created by kenneth on 9/1/16.
 */


var que = require('../util/queue');

var s = new que.Stack(0,1), e;
s.push(2);
console.log(s.getLength()); // 3
while(undefined!==(e=s.pop()))
    console.log('coolio '+e);

function assert(value, message) {
    if (!value) {
        throw message;
    }
}

function is(a, b, name) {
    assert(a === b, name + ": " + a + " isn't " + b);
}

function qtest(Queue) {
    var queue = new Queue();
    queue.push("a");
    queue.push("b");
    queue.push("c");
    is(queue.shift(), "a", Queue.name);
    is(queue.shift(), "b", Queue.name);
    is(queue.shift(), "c", Queue.name);
    if (queue.shift()) {
        throw('oops');
    }
    console.log('qtest ok '+ Queue)
}

qtest(que.ArrayQueue);
