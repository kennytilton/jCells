/**
 * Created by kenneth on 9/4/16.
 */


var H = require('./cHeader')
    , I = require('./integrity')
    , C = require('./Cell');

//@formatter:off

function clg() {
    console.log(Array.from(arguments).join(","));
}
function ast (test, msg) {
    console.assert(test,msg);
}

var UU = require('node-uuid');

/*
 defmd('Person'
 , {slots: {dbg: 'anon', cache: null, bday: Date.now()}
 , cells: {
 weight: C.cI(165)
 , height: 70
 , bmi: C.cF}
 }

 Methinks step one is to create a Model (or model-object) class that
 knows about self-awakening, installing cells, etc, such that we can
 at least create an instance under the necessary constructor/md-awaken.

 That might be enough, but inheritance can be handled later. Unless it just falls into place.

 In between we let the user worry about inheritance and then bless any given Class
 instance with model-ness.

 */

const kNascent = Symbol("md-nascent");
const kAwakening = Symbol("md-awakening");
const kAwake = Symbol("md-awaken");
const kDoomed = Symbol("md-doomed");
const kDead = Symbol("md-dead");
var id = 0;

class Model {
    constructor(parent, name, icells) {
        this.par = parent;
        this.name = name;
        this.id = ++id;
        this.state = kNascent;
        this.doomed = false; // aka in mid-notToBe
        this.fnz = false; // dunno. short for finalization?
        this.awakenOnInitp = false;
        this.cells = {};
        this.cellsFlushed = {};
        this.adoptCt = 0;
        this.pv = null; // Models tend to have an important value of some sort

        for (let slot in icells) {
            if (!icells.hasOwnProperty(slot))
                continue;

            console.log(slot + " -> " + icells[slot]);
            let value = icells[slot];

            if (value instanceof C.Cell) {
                value.name = slot;
                value.md = this; // md aka model
                this.cells[slot] = value;
                Object.defineProperty(this
                    , slot, {
                        enumerable: true
                        , get: ()=> {return value.slotValue()}
                        , set: (newv)=>{
                            return value.slotValueSet(newv);
                        }
                    });
            } else {
                Object.defineProperty(this
                    , slot, {
                        enumerable: true
                        , value: value
                        , writable: false
                    });
            }
        }
        if (this.awakenOnInitp) {
            this.awaken();
        } else {
            I.withIntegrity(I.qAwaken, this, x=> {
                this.awaken();
            })
        }
    }
    awaken() {
        if (this.state != kNascent) return this;
        this.state = kAwakening;
        for (let slot in this.cells) {
            let c = this.cells[slot];
            let lz = C.find(c.lazy, [true, C.kAlways, C.kUntilAsked]);
            if (lz) {
                T.clg('lazy!!!!', c.lazy, lz);
            } else {
                if (c.state == C.kNascent) {
                    c.awaken();
                }
            }
        }
        this.state = kAwake;
    }
    mDeadp() {return this.state==kDead}
}

module.exports.Model = Model;