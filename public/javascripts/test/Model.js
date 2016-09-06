/**
 * Created by Kenneth on 9/5/2016.
 */

var C = require('../Cell')
    , M = require('../Model');

T = require('./tester');

//@formatter:off

T.deftest('bbsteps-1',x=>{
    let bb = new M.Model(null, 'baby'
                    , {age:42});

    T.izz(m=>{
        T.setDiag(bb.age);
        return bb.age==42});

});
T.deftest('bbsteps',x=>{
    let bb = new M.Model(null, 'baby'
                , {action: C.cIe()
                , locus: C.cF(c=>{
                    switch (c.md.action) {
                        case 'leave': return 'away';
                            break;
                        case 'return': return 'home';
                            break;
                        default: return 'missing';
                    }}, {observer: (slot,me,newv)=>{
                    if (newv) {
                        T.clg(`Honey, Im ${newv}`);
                    }}})});
    T.izz(m=>{ T.setDiag(bb.locus);
        return bb.locus=='missing'});
    bb.action = 'return';
    T.izz(m=>{ T.setDiag(bb.locus);
        return bb.locus=='home'});
    bb.action = 'leave';
    T.izz(m=>{ T.setDiag(bb.locus);
        return bb.locus=='away'});
});


T.testRunAll('bbsteps');