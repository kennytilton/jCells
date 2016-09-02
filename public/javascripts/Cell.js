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

function find(x,y) {
    if (y.indexOf(x) != -1) {
        return x;
    }
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
        this.optimize = !inputp;
        this.slotOwning = false; // uhoh
        this.unchangedTest = function(a,b) { return a==b;};
        this.unchangedIf = null;

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
    valueChangedp (newv,oldv) {
        (this.unchangedIf || this.unChangedTest)(newv, oldv);
    }
    currentp() {
        return pulse >= H.pulse;
    }
    pulseUpdate(key='anon') {
        if (!this.optimizedAwayp) {
            ast(H.pulse >= this.pulse);
            this.pulse = H.pulse;
        }
    }

    ensureValueIsCurrent(tag, ensurer) {
        if (H.gNotToBe) {
            return (this.boundp && this.validp()) ? this.pv : null;
        } else if (this.currentp()) {
            return this.pv;
        } else if (this.inputp
                    && this.validp()
                    && !(this.rule && this.optimize == 'when-value'
                        && !this.pv)) {
            return this.pv;
        } else if (this.md && this.md.mDeadp()) {
            throw `evic: read of dead ${this.name} of ${this.md.name}`;
        } else {
            let recalc = false;
            if (!this.validp()) {
                recalc = true;
            } else {
                for (let used of this.useds.values()) {
                    used.ensureValueIsCurrent('nested', this);
                    if (used.pulseLastChanged > this.pulse) {
                        recalc = true;
                        break;
                    }
                }
            }
            if (recalc) {
                if (!this.currentp()) {
                    // possible if a used's observer queried me
                    this.calcNSet('evic', ensurer);
                }
                return this.pv;
            } else {
                this.pulseUpdate('valid-uninfluence');
                return this.pv;
            }
        }
    }

    slotValue() {
        var rv = undefined;
        I.withIntegrity(null,null, function () {
            let vPrior = pv;
            rv = this.ensureValueIsCurrent( 'c-read', null);
            if (!this.md && this.state == 'nascent'
                && H.pulse > this.pulseObserved) {
                this.state = 'awake';
                this.observe(vPrior, 'cget');
                this.ephemeralReset();
            }
        });
        if (H.depender) {
            this.recordDependency(H.depender);
        }
        return rv;
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
        // might not need to pass in callers
        if (H.onePulsep) {
            if (H.gCustomPropagator) {
                H.gCustomPropagator(this, vPrior);
            }
        } else {
            this.pulseLastChanged = H.pulse;
            let dp = H.depender
                , cs = H.callStack
                , pd = H.propDepth
                , dc = H.deferChanges;
            try {
                if (vPrior && this.slotOwning) {
                    // uhoh - when we get to models
                    // call not-to-be on those lostOK
                }
                this.propagateToCallers( callers);
                if (H.pulse > this.pulseObserved
                    || find(this.lazy, ['once-asked','always',true])) {
                    this.observe(vPrior,'propagate');
                }
                this.ephemeralReset();
            } finally {
                H.depender = dp;
                H.callStack = cs;
                H.propDepth = pd;
                H.deferChanges = dc;
            }
        }
    }
    propagateToCallers(callers) {
        if (this.callers.size) {
            I.withIntegrity(qNotify, c, function {
                H.causation.push(this); // this was (kinda) outside withIntegrity
                try {
                    for (let caller of this.callers.values()) {
                        if (!(caller.state == 'quiesced'
                            || caller.currentp()
                            || find(caller.lazy, [true, 'always','once-asked'])
                            || !find(this, caller.useds))) {
                            caller.calcNSet('propagate');
                        }
                    }
                } finally {
                    H.causation.pop();
                }
            });
        }
    }

    calcNSet(dbgId, dbgData) {
        //  Calculate, link, record, and propagate.
        let rawValue = this.calcNLink();
        if (!this.optimizedAwayp) {
            /*
            this check for optimized-away? arose because a rule using without-c-dependency
            can be re-entered unnoticed since that clears *call-stack*. If re-entered, a subsequent
            re-exit will be of an optimized away cell, which will have been assumed
            as part of the opti-away processing.
            */
            return this.valueAssume(rawValue, null);
        }
    }

    calcNLink() {
        /* The name is accurate: we do no more than invoke the
         rule of a formula and return its value, but along the
         way the links between dependencies and dependents get
         determined anew. */
        H.callStack.push(this);
        let dp = H.depender
            , dc = H.deferChanges;
        try {
            this.unlinkFromUsed('pre-rule-clear');
            return this.rule(this);
        } finally {
            H.callStack.pop();
            H.depender = dp;
            H.deferChanges = dc;
        }
    }
    awaken() {
        if (this.rule) {
            if (!this.currentp()) {
                this.calcNSet('c-awaken');
            }
        } else {
            if (H.pulse > this.pulseObserved) {
                // apparently double calls have occurred
                if (this.md) {
                    this.md[this.name] = this.pv;
                }
                this.observe(null);
                this.ephemeralReset();
            }
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
                    clg(`ephreset! ${this.name}`);
                    this.pv = null;
                }
            });
        }
    }

    valueAssume( newValue, propCode) {
        H.withoutCDependency(function () {
           let priorValue = this.pv
                , priorState = this.valueState;
            this.pv = newValue;
            this.state = 'awake';
            if (this.md !this.synapticp) {
                mdSlotValueStore( this.md, this.name, newValue);
            }
            this.pulseUpdate('sv-assume');
            if (propCode=='propagate'
                || ['valid','uncurrent'].indexOf(priorState) == -1
                || this.valueChanged( newValue, priorValue)) {
                let optimize = this.rule? this.optimize:null;
                if (optimize == 'when-value-t') {
                    if (this.pv) {
                        this.unlinkFromUsed(optimize);
                    }
                } else if (optimize) {
                    this.optimizeAwayMaybe( priorValue);
                }
            }
            if (!(propCode=='no-propagate'
                    || this.optimizedAway)) {
                this.propagate(priorValue, this.callers);
            }
        });
        return newValue;
    }
    unlinkFromUsed(why) {
        for (let used of this.useds.values()) {
            used.callers.remove(this);
        }
        this.useds.clear();
    }
    mdCellFlush() {
        if (this.md) {
            this.md.cellsFlushed.push([this.name, this.pulseObserved]);
        }
    }
    optimizeAwayMaybe(vPrior) {
        if (this.rule
            && !this.useds.size
            && this.optimize
            && !this.optimizedAwayp
            && this.valid()
            && !this.synapticp
            && !this.inputp) {
            this.state = 'optimized-away'; // uhoh
            this.observe( vPrior, 'optimized-away');
            if (this.md) {
                this.mdCellFlush();
                // uhoh: install value as constant
            }
            for (let caller of this.callers.values()) {
                this.callerDrop(caller);
                // ouch: next seems like a category error
                caller.ensureValueIsCurrent( 'opti-used', this); // really?
            }
        }
    }
    quiesce() {
        this.unlinkFromCallers();
        this.unlinkFromUsed('quiesce');
    }
    mdCellFlush() {
        // uhoh
        // move cells from md.cz to md.czFlushed
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

function mdSlotValueStore( me, slotName, value) {
    throw 'no model yet';
    me[slotName] = value;
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
