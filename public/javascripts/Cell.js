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

const kUnbound = Symbol("unbound");
const kUncurrent = Symbol("uncurrent");
const kValid = Symbol("valid");
const kNascent = Symbol("nascent");
const kOptimizedAwayp = Symbol("optimized-away");

// lazy options
const kOnceAsked = Symbol("lazy-once-asked");
const kUntilAsked = Symbol("lazy-until-asked");
const kAlways =Symbol("lazy-always");

// --- Cells ----------------------

class Cell {
    constructor(value, formula, inputp, ephemeralp, observer) {
        this.pulse = -1;
        this.pulseLastChanged = -1;
        this.pulseObserved = -1;
        this.lazy = false; // not a predicate (can hold, inter alia, :until-asked)
        this.callers = new Set();
        this.useds = new Set(); // formulas only
        this.ephemeralp = ephemeralp;
        this.inputp = inputp;
        this.observer = observer;
        this.optimize = !inputp;
        this.slotOwning = false; // uhoh
        this.unchangedTest = function(a,b) { return a==b;};
        this.unchangedIf = null;

        if (formula) {
            this.rule = formula;
            this.pv = kUnbound;
            this.state = H.kNascent;

            Object.defineProperty(this
                , 'v', {
                    enumerable: true
                    , get: this.slotValue
                    , set: this.slotValueSet
                });
        } else {
            this.pv = value;
            this.state = H.kValid;

            Object.defineProperty(this
                , 'v', {
                    enumerable: true
                    , get: this.slotValue
                    , set: this.slotValueSet

                });
        }
    }

    optimizedAwayp() {return this.state==kOptimizedAwayp;}
    unboundp() {return this.pv==kUnbound;}
    uncurrentp() {return this.pv==kUncurrent;}
    validp() {return !(this.unboundp() || this.uncurrentp());}
    valueState() {
        return this.unboundp() ?
                kUnbound : this.uncurrentp() ? kUncurrent : kValid;
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
        let uct = (this.unchangedIf || this.unchangedTest);
        ast(uct, 'unchanged test required');
        return !uct(newv, oldv);
    }
    currentp() {
        //clg(`currentp this pulse ${this.pulse} vs pulse ${H.gpulse()}`);
        return this.pulse >= H.gpulse();
    }
    pulseUpdate(key='anon') {
        if (!this.optimizedAwayp()) {
            ast(H.gpulse() >= this.pulse);
            this.pulse = H.gpulse();
        }
    }

    ensureValueIsCurrent(tag, ensurer) {
        //clg('evic entry');
        if (H.gNotToBe) {
            return (this.boundp && this.validp()) ? this.pv : null;
        } else if (this.currentp()) {
            //clg('currentp');
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
                //clg('evic not validp');
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
        let rv = undefined
            , self = this;
        //clg('cget depender in '+H.depender);
        I.withIntegrity(null,null, function () {
            let vPrior = self.pv;
            rv = self.ensureValueIsCurrent( 'c-read', null);
            if (!self.md && self.state == 'nascent'
                && H.gpulse() > self.pulseObserved) {
                self.state = 'awake';
                self.observe(vPrior, 'cget');
                self.ephemeralReset();
            }
        });
        if (H.depender) {
            H.depender.recordDependency(this);
        } //else clg('cget no depender '+rv);
        return rv;
    }

    slotValueSet(newv) {
        if (H.deferChanges) {
            throw `Assign to ${this.name} must be deferred by wrapping it in WITH-INTEGRITY`;
        } else if (find(this.lazy, [kOnceAsked, kAlways, true])) {
            this.valueAssume(newv, null);
        } else {
            I.withChg(this.name, ()=>{
                this.valueAssume( newv, null);
            })
        }
    }

    propagate(vPrior, callers) {
        // might not need to pass in callers
        if (H.onePulsep) {
            if (H.gCustomPropagator) {
                H.gCustomPropagator(this, vPrior);
            }
        } else {
            this.pulseLastChanged = H.gpulse();
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
                if (H.gpulse() > this.pulseObserved
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
        if (callers.size) {
            let c = this;
            I.withIntegrity(I.qNotify, c, ()=> {
                H.causation.push(c); // this was (kinda) outside withIntegrity
                try {
                    for (let caller of callers.values()) {
                        if (!(caller.state == 'quiesced'
                            || caller.currentp()
                            || find(caller.lazy, [true, kAlways,kOnceAsked])
                            || !caller.useds.has(c))) {
                            caller.calcNSet('propagate');
                        }
                    }
                } finally {
                    H.causation.pop();
                }
        })
        }
    }

    calcNSet(dbgId, dbgData) {
        //  Calculate, link, record, and propagate.
        let rawValue = this.calcNLink();
        if (!this.optimizedAwayp()) {
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
        let dp = H.depender
            , dc = H.deferChanges;

        try {
            H.callStack.push(this);
            H.depender = this;
            H.deferChanges = true;
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
            //clg('awk pulses', H.gpulse(),this.pulseObserved);
            if (H.gpulse() > this.pulseObserved) {
                // apparently double calls have occurred
                if (this.md) {
                    this.md[this.name] = this.pv;
                }
                //clg('awakenin obs!!!',this.name);
                this.observe(undefined,'awaken');
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
                    //clg(`ephreset! ${this.name}`);
                    this.pv = null;
                }
            });
        }
    }

    valueAssume( newValue, propCode) {
        let self = this;
        H.withoutCDependency(()=>{
           let priorValue = self.pv
                , priorState = self.valueState();
            self.pv = newValue;
            self.state = 'awake';
            if (self.md && !self.synapticp) {
                mdSlotValueStore( self.md, self.name, newValue);
            }
            self.pulseUpdate('sv-assume');
            //clg('priorstate', priorState.toString(),propCode);
            if (propCode=='propagate'
                || [kValid,kUncurrent].indexOf(priorState) == -1
                || self.valueChangedp( newValue, priorValue)) {
                let optimize = self.rule ? self.optimize : null;
                if (optimize == 'when-value-t') {
                    if (self.pv) {
                        self.unlinkFromUsed(optimize);
                    }
                } else if (optimize) {
                    self.optimizeAwayMaybe(priorValue);
                }

                if (!(propCode == 'no-propagate'
                    || self.optimizedAway)) {
                    self.propagate(priorValue, self.callers);
                }
            }
        });
        return newValue;
    }
    unlinkFromUsed(why) {
        for (let used of this.useds.values()) {
            //clg(`${this.name} unlinks fromused dueto ${why}`);
            used.callerDrop(this);
        }
        this.useds.clear();
    }
    mdCellFlush() {
        if (this.md) {
            this.md.cellsFlushed.push([this.name, this.pulseObserved]);
        }
    }
    observe( vPrior, tag) {
        //console.log('observe entry', vPrior);
        if (this.observer) {
            //console.log('observer', this.observer.toString());
            this.observer(this.name, this.md, this.pv, vPrior, this);
        }
    }
    optimizeAwayMaybe(vPrior) {
        if (this.rule
                && !this.useds.size
                && this.optimize
                && !this.optimizedAwayp()
                && this.validp()
                && !this.synapticp
                && !this.inputp) {
            //clg(`opti-away!!! ${this.name}`);
            this.state = kOptimizedAwayp;
            this.observe( vPrior, 'optimized-away');
            if (this.md) {
                this.mdCellFlush();
                // todo install value as constant
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
        // todo move cells from md.cz to md.czFlushed
    }
    recordDependency(used) {
        if (!used.optimizedAwayp()) {
            //clg(`recdep ${this.name} usedby ${used.name}`);
            this.useds.add(used);
            ast(this.useds.size>0);
            used.callerEnsure(this);
        }
    }
    callerEnsure(caller) {
        this.callers.add(caller);
    }
    callerDrop(caller) {
        //clg(`dropping!! caller ${caller.name} of ${this.name}`);
        this.callers.delete(caller);
    }
}

function mdSlotValueStore( me, slotName, value) {
    throw 'no model yet';
    me[slotName] = value;
}

// --- some handy cell factories -------------------

function cF(formula, options) {
    // make a conventional formula cell
    return Object.assign( new Cell(null, formula, false, false, null)
        , options);
}

function cFI(formula) {
    /*
     make a cell whose formula runs once for
     its initial value but then is set procedurally
     as an input cell.
     */
    return new Cell(null, formula, true, false, null);
}
function cI(value, options) {
    // standard input cell
    return Object.assign(new Cell(value, null, true, false, null)
        , options);
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
module.exports.cFI = cFI;
module.exports.cI = cI;
module.exports.obsDbg = obsDbg;
module.exports.kValid = kValid;
module.exports.kUnbound = kUnbound;
