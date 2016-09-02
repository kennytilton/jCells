/**
 * Created by kenneth on 9/2/16.
 */

/**
 * Created by kenneth on 8/31/16.
 */

var H = require('./cHeader')
    , I = require('./integrity');
/*
 function clg () {
 var args = Array.prototype.slice.call(arguments);
 console.log.apply(console, args);
 }
 */

function clg() {
    console.log(Array.from(arguments).join(","));
}
function ast (test, msg) {
    console.assert(test,msg);
}

// --- dependency management ------------

function cstack () {
    return H.callStack;
}

function callerPeek () {
    throw 'fixme';
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
        this.state = 'nascent';
        this.pulse = 0;
        this.pulseLastChanged = 0;
        this.pulseObserved = 0;
        this.lazy = false; // not a predicate (can hold, inter alia, :until-asked)
        this.callers = new Set();
        this.useds = new Set(); // formulas only
        this.ephemeralp = ephemeralp;
        this.inputp = inputp;
        this.observer = observer;
        this.optimizedAwayp = false;

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

    currentp () {
        return pulse >= H.pulse;
    }
    pulseUpdate (key='anon') {
        if (!this.optimizedAwayp) {
            ast(H.pulse >= this.pulse);
            this.pulse = H.pulse;
        }
    }

    slotValue() {
        let c = this
            , caller = callerPeek();

        if (caller) {
            this.callers.add(caller);
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

    ephemeralReset() {
        if (this.ephemeralp) { // tolerate calls on non-ephp
            /*
             we defer resetting ephemerals because everything
             else gets deferred and we must not in fact reset it until
             within finBiz we are sure all callers have been recalculated
             and all observers completed (which happens with recalc).
             */
            I.withIntegrity( I.qEphemReset, this, function () {
                let me = rc.md;
                if (me) {
                    throw "md fnyi";
                } else {
                    clg(`ephreset! ${this.name}`)
                    this.pv = null;
                }
            });
        }
    }

    recordDependency(used) {
        if (!used.optimizedAwayp) {
            this.useds.add(used);
            used.callerEnsure(this);
        }
    }
    callerEnsure(caller) {
        this.callers.add(caller);
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

function obsDbg (name, me, newv, priorv, c) {
    console.log(`OBS: ${name} now ${newv} (was ${priorv})`);
}
module.exports.Cell = Cell;
module.exports.cIe = cIe;
module.exports.cF = cF;
module.exports.obsDbg = obsDbg;
