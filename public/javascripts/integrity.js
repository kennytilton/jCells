/**
 * Created by kenneth on 9/1/16.
 */

var Q = require('./util/queue');
var H = require('./cHeader');

function clg() {
    console.log(Array.from(arguments).join(","));
}

var gWithinIntegrity = false;
var dpLogp = false;

const qNotify = new Q.ArrayQueue();
const qAwaken = new Q.ArrayQueue();
const qClient = new Q.ArrayQueue();
const qEphemReset = new Q.ArrayQueue();
const qChange = new Q.ArrayQueue();

function ufbAdd( q, task) {
    q.push( task);
}
function qDo (q) {
    let taskInfo = q.shift();
    if (taskInfo) {
        let [deferInfo, task] = taskInfo;
        task('oops', deferInfo); // sb q opcode
        qDo(q);
    }
}

function finBiz (q) {
    switch (q) {
        case qNotify:
            qDo(q);
            qDo(qAwaken);
            finBiz(qNotify.emptyp() ? qClient : qNotify);
            break;
        case qClient:
            (H.clientQHandler || qDo)(q);
            finBiz(qClient.emptyp() ? qEphemReset : qClient);
            break;
        case qEphemReset:
            qDo(q);
            finBiz(qChange);
            break;
        case qChange:
            let work = q.shift();
            if (work) {
                let [info, taskfn] = work;
                dataPulseNext('change');
                taskfn('change', info);
                finBiz(qNotify);
            } // else we fall out, business finished
    }
}

function withoutIntegrity (fn) {
    let wi, dc, cs;
    wi = gWithinIntegrity;
    dc = H.deferChanges;
    cs = H.callstack;

    try {
        gWithinIntegrity = false;
        H.deferChanges = false;
        H.callstack = new Q.Stack();
        fn()
    } finally {
        gWithinIntegrity = wi;
        H.deferChanges = dc;
        H.callStack = cs;
    }
}

function withIntegrity (queue, deferInfo, action) {
    if (H.gStop) return;

    if (gWithinIntegrity) {
        if (queue) {
            ufbAdd(queue, [deferInfo, action]);
            /*
             assignment is supposed to return the value being installed
             in the place, but if the SETF is deferred we return
             something that will help someone who tries to use
             the setf'ed value figure out what is going on:
             */
            return 'deferred-to-ufb';
        } else {
            /*
             So by not supplying an opcode one can get something
             executed immediately, potentially breaking data integrity
             but signifying by having coded  with-integrity
             that one is aware of this.

             If you have read this comment.
             */
            action(queue, deferInfo)
        }
    } else {
        let wi = gWithinIntegrity
            , dc = H.deferChanges;

        gWithinIntegrity = true;
        H.deferChanges = false;
        try {
            if ((!H.gpulse()) || queue == qChange) {
                H.dataPulseNext('cwi');
            }
            let result = action(queue, deferInfo);
            finBiz(qNotify);
            return result;
        } finally {
            gWithinIntegrity = wi;
            H.deferChanges = dc;
        }
    }
}

function withChg(id, fn) {
    withIntegrity( qChange, id, fn);
}

module.exports.withIntegrity = withIntegrity;
module.exports.withChg = withChg;
module.exports.qNotify = qNotify;
module.exports.qEphemReset = qEphemReset;
