/**
 * Created by kenneth on 8/29/16.
 */

var misc = require('./misc');
var que = require('./util/queue');
var tr = require('./util/trc');

console.log("Adding %d to 10 gives us %d", misc.x, 42);
console.log("Adding %d to 10 gives us %d", misc.x, misc.addX(10));

var s = new que.Stack(0,1), e;
s.push(2);
console.log(s.getLength()); // 3
while(undefined!==(e=s.pop()))
    console.log('cooler '+e); // 2, 1, 0

tr.clog('pop '+s.pop())
tr.clog((function () {
    let xx = 40;
    let yy = 2;
    return xx+yy;
    })());

tr.clog(Symbol("himom").name);

tr.clog((x => x * x)(7));

console.log('whoa %d ', 42);

function zap (n) {
    zap.prototype.ubv = Symbol("cvUbd");
    zap.prototype.yy=2*n;
    this.zip = n;
    this.v = zap.prototype.ubv;
}

zap.prototype.ubp = function () {
    // console.trace('boom',42);
    return this.v == this.ubv;
}
var zz = new zap(42);

console.log('%s %s',zz.zip, zz.ubp(),zap.prototype.ubv);

var MM = MM || {};

MM.event ={};

var MYAPP = MYAPP || {};
MYAPP.event = {};

MYAPP.commonMethod = {
    regExForName: "", // define regex for name validation
    regExForPhone: "", // define regex for phone no validation
    validateName: function(name){
        // Do something with name, you can access regExForName variable
        // using "this.regExForName"
    },

    validatePhoneNo: function(phoneNo){
        // do something with phone number
    }
}

// Object together with the method declarations
MYAPP.event = {
    addListener: function(el, type, fn) {
        // code stuff
    },
    removeListener: function(el, type, fn) {
        // code stuff
    },
    getEvent: function(e) {
        // code stuff
    }

    // Can add another method and properties
}

var Person = function (firstName) {
    this.firstName = firstName;
};

Person.prototype.sayHello = function() {
    console.log("Hello, I'm " + typeof this); // this.firstName);
};

var person1 = new Person("Alice");
var person2 = new Person("Bob");
var helloFunction = person1.sayHello;

// logs "Hello, I'm Alice"
person1.sayHello();

// logs "Hello, I'm Bob"
person2.sayHello();

// logs "Hello, I'm undefined" (or fails
// with a TypeError in strict mode)
helloFunction();

// logs true
console.log(helloFunction === person1.sayHello);

// logs true
console.log(helloFunction === Person.prototype.sayHello);

// logs "Hello, I'm Alice"
helloFunction.call(null);

tr.clog('infinity %s', 3.0/Infinity);

tr.clog(eval("var jj = 40+2;"));

tr.clog(jj);

var ss = new Set([1,2,3]);
ss.add(5);
console.log("%s %s",ss.length,ss.size);

ss.forEach( x => tr.clog('cool '+ x));

// Define the Person constructor
var Person = function(firstName) {
    this.firstName = firstName;
};

// Add a couple of methods to Person.prototype
Person.prototype.walk = function(){
    console.log("I am walking!");
};

Person.prototype.sayHello = function(){
    console.log("Hello, I'm " + this.firstName);
};

// Define the Student constructor
function Student(firstName, subject) {
    // Call the parent constructor, making sure (using call)
    // that "this" is set correctly during the call
    Person.call(this, firstName);

    // Initialize our Student-specific properties
    this.subject = subject;
}

// Create a Student.prototype object that inherits from Person.prototype.
// Note: A common error here is to use "new Person()" to create the
// Student.prototype. That's incorrect for several reasons, not least
// that we don't have anything to give Person for the "firstName"
// argument. The correct place to call Person is above, where we call
// it from Student.
Student.prototype = Object.create(Person.prototype); // See note below

// Set the "constructor" property to refer to Student
Student.prototype.constructor = Student;

// Replace the "sayHello" method
Student.prototype.sayHello = function(){
    console.log("Hello, I'm " + this.firstName + ". I'm studying "
        + this.subject + ".");
};

// Add a "sayGoodBye" method
Student.prototype.sayGoodBye = function(){
    console.log("Goodbye!");
};

// Example usage:
var student1 = new Student("Janet", "Applied Physics");
student1.sayHello();   // "Hello, I'm Janet. I'm studying Applied Physics."
student1.walk();       // "I am walking!"
student1.sayGoodBye(); // "Goodbye!"

// Check that instanceof works correctly
console.log(student1 instanceof Person);  // true
console.log(student1 instanceof Student); // true

function Stud(firstName, subject) {
    // Call the parent constructor, making sure (using call)
    // that "this" is set correctly during the call
    //Person.call(this, firstName);

    // Initialize our Student-specific properties
    this.subject = subject;
}
tr.clog(Object.keys(new Stud("aaa")));
Stud.prototype.boom = function () {console.log('boom '+this.subject);};
tr.clog(Object.keys(Stud.prototype));
tr.clog(Object.keys(Student.prototype));
(new Stud("bob", "JS")).boom();

function abc(x) {return 2*x;}

tr.clog('abc='+Object.keys(abc.prototype));
tr.clog('src='+abc.toString());

