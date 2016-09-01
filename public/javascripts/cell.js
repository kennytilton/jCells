/**
 * Created by kenneth on 8/31/16.
 */

function clg () {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
}
function ast (test, msg) {
    console.assert(test,msg);
}
var window = {'callStack': []};

function cstack () {
    return window.callStack;
}

function callerPeek () {
    let stk = cstack()
    , ct = stk.length;
    return ct? stk[ct-1]:null;
}

function callerPush(c) {
    ast(c instanceof Cell);
    cstack().push(c);
}

function callerPop () {
    cstack().pop();
}

var gUnbound = Symbol("unbound");

function Cell(value) {
    this.callers = new Set();

    if (value instanceof CRule) {
        this.rule = value;
        this.pv = gUnbound;
        Object.defineProperty(this
            , 'v', {
                enumerable: true,
                get: function () {
                    return this.slotValue();
                }});
    } else {
        this.pv = value;
        Object.defineProperty(this
            , 'v', {
                enumerable: true
                , set: this.slotValueSet
                , get: this.slotValue

            });
    };
}


function CRule(rule) {
    this.fn = rule;
    this.vstate = Symbol('unbound');
}

Cell.prototype.slotValue = function () {
    let c = this;
    ast(c instanceof Cell);

    let caller = callerPeek()
        , cs = this.callers;

    if (caller) {
        cs.add(caller);
    }

    if (c.pv==gUnbound) {
        return c.evic();
    } else {
        return c.pv;
    }
}

Cell.prototype.slotValueSet = function (newv) {
    this.pv = newv;
    this.callers.forEach( function (caller) {
        caller.calcNSet();
    });
    return this.pv;
}

Cell.prototype.calcNSet = function () {
    return this.evic();
}

Cell.prototype.evic = function () {
    let c = this;
    callerPush(c);
    try {
        return c.pv = c.rule.fn(c);
    } finally {
        callerPop();
    }
}

function cq (rule) {
    return new CRule(rule);
}

/*
 A minimal proof of concept, precursor to my standard
 Cells "Hello, world" in which a knock-knock by the World
 goes unanswered until our resident returns home.

 */

/*
Our first Cell is a so-called "input" Cell, akin to a
a spreadsheet cell in which one plays "what if?", eg, a cell where
the user can try different prime rates to see how their budget changes.

In UI apps, we have input cells for keystrokes, mouse clicks, etc that get fed
in the corresponding event handlers.

In this case we will just move things along with top-level assignments.

 */
var action = new Cell(); // the resident action (leave or return)

/*
And now a so-called ruled or formula cell, which will establish
a dependency on the action simply by reading the value with
conventional property access syntax.

 */
var location = new Cell( cq( function (c) {
    switch (action.v) {
        case 'leave':
            return 'away';
        case 'return':
            return 'home';
        default:
            return 'MIA';
    }
}));

ast(location.v=='MIA');

clg('location before any action', location.v);

action.v = 'leave';

ast(location.v == 'away');

clg('location after leave', location.v );

action.v = 'return';

ast(location.v=='home');

clg('location after return', location.v);