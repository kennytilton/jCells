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
    this.propagate();
    return this.pv;
}

Cell.prototype.propagate = function () {
    this.callers.forEach( function (caller) {
        caller.calcNSet();
    });
}

Cell.prototype.calcNSet = function () {
    return this.evic();
}

Cell.prototype.evic = function () {
    let c = this;
    callerPush(c);
    try {
        c.pv = c.rule.fn(c);
        c.propagate();
        return c.pv;
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
function weAre(tag='anon') {
    clg(`${tag}: we are ${location.v} after ${action.v || 'nada'}, alarm ${alarm.v}`);
};

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

/*
    a rule off a rule to confirm recursive propagation
 */

var alarm = new Cell( cq( function (c) {
    switch (location.v) {
        case 'home':
            return 'off';

        default:
            return 'on';
    }
}));

/* --- test --- */

// before any action:

ast(location.v=='MIA');
ast(alarm.v='on');
weAre('init');

action.v = 'leave';
ast(location.v == 'away');
ast(alarm.v='on');
weAre();

action.v = 'return';
ast(alarm.v='off');
ast(location.v=='home');
weAre('back');