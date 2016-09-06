/**
 * Created by Kenneth on 9/6/2016.
 */

var C = require('../Cell')
    , M = require('../Model')
    , T = require('./tester');

T.deftest('fm-0',xxx=>{
    let u = new M.Model(null,'fm0', {
                kon: C.cI(false, {name:'kon'})
                , kids: C.cF(c=>{
                        let ks = [];
                        if (c.md.kon) {
                            ks.push(new M.Model(c.md, 'konzo'
                                , {kzo: C.cI(3)}));
                        }
                        return ks})});
    T.izz(x=>{ return u.kids.length==0});
    u.kon = true;
    T.izz(x=>{ return u.kids.length==1});
});

T.testRun('fm-0');