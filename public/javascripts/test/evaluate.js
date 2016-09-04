H = require('../cHeader');
C = require('../Cell');

//@formatter:off

function clg() {
    console.log(Array.from(arguments).join(","));
}
function ast (test, msg) {
    console.assert(test,msg);
}

var testName = '???';
var diag = null;

function izz(fn) {
    diag = null;
    if (!fn()) {
        console.log(`${testName} FAIL:\n ${fn.toString()}\nDIAG: ${diag}`);
        throw 'boom';
    }
}

var test = {};
function deftest(name,fn) {
    test[name] = fn;
}

function testRun(name) {
    if (!test[name]) throw `no such test as ${name}`;
    testName=name;
    clg(`Testing ${name}`);
    H.cellsReset();
    test[name]();
}

function testRunAll() {
    for (let name of Object.keys(test))
        testRun(name);
}

function usedct(c) {return c.useds.size;}
function callerct(c) {return c.callers.size;}

deftest('test-cI', () => {
    let c = C.cI(42);
    ast(c instanceof C.Cell);
    izz(() => {return c instanceof C.Cell});
    izz(() => {return c.valueState() == C.kValid});
    izz(() => {return c.callers instanceof Set});
    izz(() => {return !c.callers.size});
    izz(() => {return c.inputp});
    izz(() => {return c.validp()});
    izz(() => {return c.v==42});
});

deftest('t-formula', ()=>{
    let c = C.cF(() => {return 40 + 2});
    c.name='c';
    izz(() => {return c instanceof C.Cell});
    izz(() => {return c.valueState()==C.kUnbound});

    izz(() => {return callerct(c)==0});
    izz(() => {return usedct(c)==0});
    izz(() => {return !c.validp()});

    izz(() => {return c.v == 42});

    izz(() => {return callerct(c)==0});
    izz(() => {return usedct(c)==0});
    izz(() => {return c.validp()});
});


deftest( 't-formula-2', ()=>{
    let b = C.cI(2)
    , cct = 0
    , dct = 0
    , c = C.cF(()=> { ++cct; return 40 + b.v;})
    , d = C.cF(() => { ++dct; return b.v + c.v;});
    ast(b.useds.size==0);
    izz(() => {return b.v == 2});
    izz(() => {return c.v == 42});
    izz(() => {return d.v == 44});
    izz(() => {return cct == 1});
    izz(() => {return dct == 1});
    izz(() => {return usedct(b) == 0});
    izz(() => {return callerct(b) == 2});
    izz(() => {return usedct(c) == 1});
    izz(() => {return callerct(c) == 1});
    izz(() => {return usedct(d) == 2});
    izz(() => {return callerct(d) == 0});
});



deftest( 't-in-reset', ()=>{
    let yowza = 0
        , obsct = 0
        , b = C.cI(2, {'name' : 'bb'
                   , 'observer' : (n, m, nv) => {
                       ++obsct;
                       //clg('bb obs!!', obsct, nv, ov||'nada');
                        yowza = nv}});

    izz(()=>{return b.name=='bb'});
    izz(()=>{return obsct==0});
    b.awaken();
    izz(()=>{diag = obsct; return obsct==1});
    //clg('ass same');
    b.v = 2;
    //clg('assed same');
    izz(()=>{diag = obsct; return obsct==1});
    izz(() => {return yowza==2});
    b.v = 42;
    izz(()=>{return obsct==2});
    izz(() => {return b.v==42});
    izz(() => {return yowza==42});
        });

deftest('t-formula-22', ()=>{
   let b = C.cI(2,{'name' : 'bb'})
    , cct = 0
    , dct = 0
    , c = C.cF(()=>{
        ++cct;
        return b.v + 40;
    }, {'name':'cc'})
    , d = C.cF(()=>{
        ++dct;
        return c.v + b.v;
        }, {'name':'dd'});

    izz(()=> {return d.v==44});
    izz(()=> {return c.v==42});
    izz(()=> {return b.v==2});
    izz(()=> {return dct==1});
    izz(()=> {return cct==1});
    b.v=3;
    izz(()=> {return d.v==46});
    izz(()=> {return c.v==43});
    izz(()=> {return b.v==3});
    izz(()=> {return dct==2});
    izz(()=> {return cct==2});
});

function cmatch( s, ns) {
    let sn = [];
    for (let c of s)
        sn.push(c.name);
    clg(`cmatch actual=${sn} expected=${ns}`);
    return true;
}
deftest( 'pentagram', ()=>{
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
        izz(() => {return aa.v == 2 && bb.v == 2
            && cc.v == 20 && dd.v == 200
            && ee.v == 2000072})};

    izz(() => {return aa.v == 1});
    izz(() => {return bb.v == 1});
    izz(() => {return cc.v == 10});
    izz(() => {return dd.v == 42});
    izz(() => {return ee.v == 420071});
    izz(() => {return aa.useds.size == 0});

    izz(() => {return cmatch(bb.useds,['aa'])});
    izz(() => {return cmatch(bb.callers,['dd','ee'])});

    izz(() => {return cmatch(cc.useds,['aa'])});
    izz(() => {return cc.callers.size == 0});

    izz(() => {return cmatch(dd.useds,['bb'])});
    izz(() => {return cmatch(dd.callers,['ee'])});

    izz(() => {return cmatch(ee.useds,['a70','bb','dd'])});
    izz(() => {return ee.callers.size == 0});

    rset();

    ++aa.v;

    verifyPCurrent();

    ++aa.v;

    ast(dd.v==42);


});

deftest('opti-away',()=>{
    let aa = C.cF(()=>{return 42;});
    aa.awaken();
    izz(()=>{
        diag='aaa';//aa.v;
        console.log('aa='+aa.v.toString());
        return aa.v==42;
    });
    izz(()=>{
        diag='bbb';//aa.v;
        return aa.optimizedAwayp();
    });

});

function evenp(n) {return n%2==0}
function oddp(n) {return n%2==1}
function unchangeHack(n,p) {
    return typeof n == "number"
            && typeof p == "number"
            && ((evenp(n) && evenp(p))
                || (oddp(n) && oddp(p)));
}
deftest('unchanged',()=>{
    let ob = 0
    , b = C.cI(2, {'name':'bb'
                    , 'observer' : ()=>{
                        clg('obsing');
                        ++ob}
                    , 'unchangedIf': unchangeHack})
    , cct = 0
    , c = C.cF(()=>{
        ++cct;
        return b.v+40;
    }, {'name':'cc'});
    b.awaken();
    ast(c.v==42);
    ast(b.v==2);
    clg('ob='+ob);
    ast(ob==1);
    ast(cct==1);
    b.v = 4;
    ast(c.v==42);
    ast(b.v==4);
    ast(ob==1);
    ast(cct==1);

    b.v = 5;
    ast(c.v==45);
    ast(b.v==5);
    ast(ob==2);
    ast(cct==2);
})

/*testRun('test-cI');
testRun('t-formula');
testRun('t-formula-2');
testRun('t-in-reset');*/
testRun('unchanged');
testRunAll();