/**
 * Created by kenneth on 8/31/16.
 */

function Cell(name,value,md) {
    /*if (md) {
        this.md = md;
        md.slot = md.slot || {};
        this.md.slot[name] = value;
    } else {
        this.value = value;
    }*/
    this.md = md;
    if (md) {
        Object.defineProperty(md
            , name, {
                enumerable: true,
                writable: true,
                value: value
            });

    } else {
        Object.defineProperty(this
        , name, {
                enumerable: true,
                writable: true,
                value: value
            });
    };
}

var c = new Cell('where','home');

console.log('ckeys=',Object.keys(c));
//console.log('cval=', c.value);
console.log('cwhere=', c.where);

var p = {};
var mc = new Cell('where','home',p);

console.log('w=',Object.keys(mc));
console.log('w=', p.where);
