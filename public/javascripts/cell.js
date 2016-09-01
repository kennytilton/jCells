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

// --- dependency management ------------

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


// --- Cells ----------------------

class Cell {
    constructor(value, formula, inputp, ephemeralp, observer) {
        this.callers = new Set();

        this.ephemeralp = ephemeralp;
        this.inputp = inputp;
        this.observer = observer;

        if (formula) {
            this.rule = formula;
            this.pv = gUnbound;
            Object.defineProperty(this
                , 'v', {
                    enumerable: true,
                    get: function () {
                        return this.slotValue();
                    }
                });
        } else {
            this.pv = value;
            Object.defineProperty(this
                , 'v', {
                    enumerable: true
                    , set: this.slotValueSet
                    , get: this.slotValue

                });
        }
    }
    named (n) {
        this.name=n;
        return this;
    }
    obs (fn) {
        this.observer = fn;
        return this;
    }
    slotValue() {
        let c = this;
        ast(c instanceof Cell);

        let caller = callerPeek()
            , cs = this.callers;

        if (caller) {
            cs.add(caller);
        }

        if (c.pv == gUnbound) {
            return c.evic();
        } else {
            return c.pv;
        }
    }

    slotValueSet(newv) {
        let vPrior = this.pv
            , rv = this.pv = newv;

        this.propagate(vPrior, this.callers);

        if (this.ephemeralp)
            this.pv = null;
        return rv;
    }

    propagate(vPrior, callers) {
        // not sure why callers are passed in
        if (callers) {
            callers.forEach(function (caller) {
                caller.calcNSet();
            });
        }
        if (this.observer) {
            this.observer( this.name, null, this.pv, vPrior, this);
        }
    }

    calcNSet() { // this will get more interesting...
        let vPrior = this.pv
            , newv = this.evic();
        this.propagate( vPrior, this.callers);
        return newv;
    }

    evic() { // ensureValueIsCurrent
        let c = this;
        callerPush(c);
        try {
            c.pv = c.rule(c);
            return c.pv;
        } finally {
            callerPop();
        }
    }
}

// --- some handy cell factories -------------------

function cF(formula) {
    // make a conventional formula cell
    return new Cell(null, formula, false, false, null);
}

function cFi(formula) {
    /*
     make a cell whose formula runs once for
     its initial value but then is set procedurally
     as an input cell.
      */
    return new Cell(null, formula, true, false, null);
}
function cI(value) {
    // standard input cell
    return new Cell(value, null, true, false, null);
}

function cIe(value) {
    // ephemeral input cell
    return new Cell(value, null, true, true, null);
}

/* --------------------------------------------------------------

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

var action = cIe()
                .named('action')
                .obs((name, me, newv, oldv, c) => {
                    clg(`HCO: action was ${newv}`);
                });

ast(action instanceof Cell);
//    'obs((name, me, newv, oldv, c)=>
  //              clg(`obs! ${name})); // the resident action (leave or return)

/*
And now a so-called ruled or formula cell, which will establish
a dependency on the action simply by reading the value with
conventional property access syntax.

 */

function obsDbg (name, me, newv, priorv, c) {
    clg(`OBS: ${name} now ${newv} (was ${priorv})`);
}

var location = cF(c=> {
        switch (action.v) {
        case 'leave':
            return 'away';
        case 'return':
            return 'home';
        default:
            return 'MIA';
        }
    })
    .named('locus')
    .obs(obsDbg);

/*
    a rule off a rule to confirm recursive propagation
 */

var alarm = cF( c=>{
    switch (location.v) {
        case 'home':
            return 'off';

        default:
            return 'on';
    }
});

var noise = cIe()
                .named('noise')
                .obs(obsDbg);

const hworld = 'Hello, world.'
    , klanging = 'klang-klang-klang'
    , silence = '<Silence>';

var response = cF( c=>{
    switch (noise.v) {
    case 'knock-knock':
        switch (location.v) {
            case 'home':
                return hworld;
                break;
            default:
                return silence;
        }
        break;
    case 'crash':
        switch (alarm.v) {
            case 'on':
                return klanging;
                break;
            default:
                switch (location.v) {
                    case 'home':
                        return 'I have a gun!';
                        break;
                    default:
                        return '<Stealing sounds>';
                }
        }
        break;
    default:
        return null;
    }})
    .named('response')
    .obs(obsDbg);

/* --- test --- */

// before any action:

ast(location.v=='MIA');
ast(alarm.v=='on');
ast(response.v==null);

action.v = 'leave';
ast(action.v==null); // ephemerality in action
ast(location.v == 'away');
ast(alarm.v=='on');

noise.v = 'knock-knock';
ast(response.v==silence);

noise.v = 'crash';
ast(response.v==klanging);

action.v = 'return';
ast(action.v==null); // ephemerality
ast(alarm.v=='off');
ast(location.v=='home');

noise.v = 'knock-knock';
ast(response.v==hworld);

