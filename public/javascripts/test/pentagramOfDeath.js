/**
 * Created by Kenneth on 9/5/2016.
 */
/**
 * Created by Kenneth on 9/4/2016.
 */

C = require('../Cell');
T = require('./tester');

function cmatch( s, ns) {
    let sn = [];
    if (ns.length != s.size) {
        clg('len nope');
        return false;
    }
    for (let c of s)
        if (!T.find(c.name, ns)) {
            clg('nope', c.name, ns.length);
            return false;
        }

    // var difference = new Set([...s].filter(c => !set2.has(x)));
    ns.forEach((n,i)=> {
        found = false;
        for (let c of s) {
            if (c.name==n) {
                found = true;
                break;
            }
        }

        if (!found) {
            clg('sn nope '+ n);
            return false;
        }
    });
    //   if (!s)
    return true;
}


T.deftest( 'pentagram', ()=>{
    let run = {}
        , obs = {}
        , rset = ()=>{run = {}; obs ={};}
        , logrun = (key)=>{
        run[key] = 1 + (run[key] || 0)}
        , podobs = (name,me,newv,oldv,c)=>{
        obs[name] = 1 + (obs[name] || 0)}
        , aa = C.cI(1, {'name':'aa','observer':podobs})
        , a7 = C.cI(7, {'name':'a7','observer':podobs})
        , a70 = C.cF(()=>{
        logrun('a70');
        return 10 * a7.v;
    }, {'name':'a70','observer':podobs})
        , bb = C.cF(()=>{
        logrun('bb');
        return aa.v;
    }, {'name':'bb','observer':podobs})
        , cc = C.cF(()=>{
        logrun('cc');
        return 10 * aa.v;
    }, {'name':'cc','observer':podobs})
        , dd = C.cF(()=>{
        logrun('dd');
        return (bb.v % 2 == 0)?
        10 * cc.v : 42;
    }, {'name':'dd','observer':podobs})
        , ee = C.cF(()=>{
        logrun('ee');
        return a70.v + bb.v + (10000 * dd.v);
    }, {'name':'ee','observer':podobs})
        , verifyPCurrent = ()=>{
        T.izz(() => {return aa.v == 2 && bb.v == 2
            && cc.v == 20 && dd.v == 200
            && ee.v == 2000072})};

    T.izz(() => {return aa.v == 1});
    T.izz(() => {return bb.v == 1});
    T.izz(() => {return cc.v == 10});
    T.izz(() => {return dd.v == 42});
    T.izz(() => {return ee.v == 420071});
    T.izz(() => {return aa.useds.size == 0});

    T.izz(() => {
        diag = bb.useds.size;
        //console.log(bb.useds.keys());
        return cmatch(bb.useds,['aa'])});

    T.izz(() => {return cmatch(bb.callers,['dd','ee'])});

    T.izz(() => {return cmatch(cc.useds,['aa'])});
    T.izz(() => {return cc.callers.size == 0});

    T.izz(() => {return cmatch(dd.useds,['bb'])});
    T.izz(() => {return cmatch(dd.callers,['ee'])});

    T.izz(() => {return cmatch(ee.useds,['a70','bb','dd'])});
    T.izz(() => {return ee.callers.size == 0});

    rset();

    ++aa.v;

    verifyPCurrent();

    ++aa.v;

    T.ast(dd.v==42);


});

T.testRun('pentagram');