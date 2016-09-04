/**
 * Created by kenneth on 8/29/16.
 *
 * Following the structure of the Clojure CLJS Rube library
 *
 */

function clg() {
    console.log(Array.from(arguments).join(","));
}

var que = require('./util/queue');

var ppulse = 0;
function gpulse() {
    return ppulse;
}
var onePulsep = false;
var dpLogp = false;

function dataPulseNext(who = 'anon') {
    if ( !onePulsep ) {
        if ( dpLogp ) {
            clg(`dpnext ${who}`);
        }
        ppulse = ppulse+1;
        //clg(`ppulse now ${ppulse}`);
    }
    //clg(`ppulse exits ${ppulse}`);
    return ppulse;
}

function cellsReset(options = {}) {
    gCDebug = options.debug;
    clientQHandler = options.clientQHandler;
    cellsInit();
}

function cellsInit () {
    //clg('initcells');
    ppulse = 0;
}

var causation = new que.Stack();

var callStack = new que.Stack();

var depender = null;

function withoutCDependency(fn) {
    let sd;
    sd = depender;
    try {
        fn();
    } finally {
        depender = sd;
    }
}

var deferChanges = false;

var clientQHandler = null;

var gCustomPropagator = null;

var gNotToBe = false;

// var gCPropDepth = 0;

var gCDebug = false;

var gStop = false; // emergency brake

module.exports.cellsReset = cellsReset;
module.exports.gpulse = gpulse;
module.exports.causation = causation;
module.exports.dataPulseNext = dataPulseNext;

module.exports.clientQHandler = clientQHandler;
module.exports.callStack = callStack;
module.exports.deferChanges = deferChanges;
module.exports.gStop = gStop;
module.exports.gNotToBe = gNotToBe;
module.exports.depender = depender;
module.exports.onePulsep = onePulsep;
module.exports.gCustomPropagator = gCustomPropagator;

module.exports.withoutCDependency = withoutCDependency;
