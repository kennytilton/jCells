/**
 * Created by kenneth on 8/31/16.
 */

function clg () {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
}
function ass (test, msg) {
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
    ass(c instanceof Cell);
    cstack().push(c);
    ass(callerPeek()==c,'peeknope');
}

function callerPop () {
    cstack().pop();
}

function Cell(name,value,md) {
    /*if (md) {
        this.md = md;
        md.slot = md.slot || {};
        this.md.slot[name] = value;
    } else {
        this.value = value;
    }*/
    this.name = name;
    this.md = md;
    this.callers = new Set();
    if (md) {
        Object.defineProperty(md
            , name, {
                enumerable: true,
                writable: true,
                value: value
            });

    } else {
        if (value instanceof CRule) {
            this.rule = value;
            Object.defineProperty(this
                , name, {
                    enumerable: true,
                    get: function () {
                        return this.slotValue();
                    }});
        } else {
            this.pv = value;
            Object.defineProperty(this
                , name, {
                    enumerable: true
                    , set: function (newv) {
                        return this.pv = newv;
                    }
                    , get: function () {
                        let caller = callerPeek();
                        console.log('get cinput', this.name
                                    , 'caller', caller);
                        if (caller) {
                            console.log('caller!',caller.name
                                ,'calls', this.name);
                            this.callers.add[caller];
                        }
                        return this.pv;
                    }
                });
        }
    };
}

function CRule(rule) {
    this.fn = rule;
    this.vstate = Symbol('unbound');
}

Cell.prototype.slotValue = function () {
    let c = this;
    console.log('cslotv ', c.name, c.pv);

    console.assert(c instanceof Cell);
    if ('pv' in c) {
        return c.pv;
    } else {
        return c.evic();
    }
}

function clg () {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
}

Cell.prototype.evic = function () {
    let c = this;
    clg('evic in prepush',c.name);
    callerPush(c);
    try {
        return c.pv = c.rule.fn(c);
    } finally {
        callerPop();
        clg('evic out postpop',c.name);
    }
}

function cq (rule) {
    return new CRule(rule);
}



var e = new Cell('action');
console.log('eact %s',e.action);

var c = new Cell('where', cq( function (c) {
    console.log('in rule!! %s', typeof c);
    switch (e.action) {
        case 'leave':
            return 'away';
        case 'return':
            return 'home';
        default:
            return 'MIA';
    }
}));

console.assert(c.where=='MIA', 'MIA nope');
console.log('cwhere=', c.where);

e.action = 'leave';

console.assert(c.where=='away', 'away nope');
console.log('cwhere=', c.where);

/*
var p = {};
var mc = new Cell('where','home',p);

console.log('w=',Object.keys(mc));
console.log('w=', p.where);
*/