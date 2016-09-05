/**
 * Created by Kenneth on 9/5/2016.
 */

var C = require('./cell');

function clg () {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
}
function ast (test, msg) {
    console.assert(test,msg);
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

var action = C.cIe()
    .named('action')
    .obs((name, me, newv, oldv, c) => {
        clg(`HCO: action was ${newv}`);
    });

ast(action instanceof C.Cell);
//    'obs((name, me, newv, oldv, c)=>
//              clg(`obs! ${name})); // the resident action (leave or return)

/*
 And now a so-called ruled or formula cell, which will establish
 a dependency on the action simply by reading the value with
 conventional property access syntax.

 */

var location = C.cF(c=>{
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
    .obs(C.obsDbg);

/*
 a rule off a rule to confirm recursive propagation
 */

var alarm = C.cF( c=>{
    switch (location.v) {
        case 'home':
            return 'off';

        default:
            return 'on';
    }});

var noise = C.cIe()
    .named('noise')
    .obs(C.obsDbg);

const hworld = 'Hello, world.'
    , klanging = 'klang-klang-klang'
    , silence = '<Silence>';

var response = C.cF( c=>{
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
    .obs(C.obsDbg);

/* --- test --- */

// see below for actual output from recent run


// before any action:
ast(location.v=='MIA');
ast(alarm.v=='on');
ast(response.v==null);

action.v = 'leave';
ast(action.v==null); // ephemerals revert to nil after propagating
ast(location.v == 'away');
ast(alarm.v=='on');

noise.v = 'knock-knock';
ast(response.v==silence);

noise.v = 'crash';
ast(response.v==klanging);

action.v = 'return';
ast(alarm.v=='off');
ast(location.v=='home');

noise.v = 'knock-knock';
ast(response.v==hworld);

/* --- expected output ----------

 n.b some things seem out of order because this light version
 of Cells lacks the so-called data integrity logic that
 carefully orchestrates state change, propagation, and
 observation. eg, observers should not run until after
 all propagation has run, and then they should run in
 order.

 OBS: locus now away (was MIA)
 HCO: action was leave
 OBS: response now <Silence> (was null)
 OBS: noise now knock-knock (was undefined)
 OBS: response now klang-klang-klang (was <Silence>)
 OBS: noise now crash (was null)
 OBS: response now null (was klang-klang-klang)
 OBS: response now null (was null)
 OBS: locus now home (was away)
 HCO: action was return
 OBS: response now Hello, world. (was null)
 OBS: noise now knock-knock (was null)

 */