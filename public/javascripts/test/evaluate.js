H = require('../cHeader');
C = require('../Cell');

//@formatter:off

function find(x,y) {
    if (y.indexOf(x) != -1) {
        return x;
    }
}
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
    , c = C.cF(c=>{
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
    if (ns.length != s.size) {
        clg('len nope');
        return false;
    }
    for (let c of s)
        if (!find(c.name, ns)) {
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

    izz(() => {
        diag = bb.useds.size;
        //console.log(bb.useds.keys());
        return cmatch(bb.useds,['aa'])});

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
                    , 'observer' : ()=>{ ++ob}
                    , 'unchangedIf': unchangeHack})
    , cct = 0
    , c = C.cF(()=>{
        ++cct;
        return b.v+40;
    }, {'name':'cc'});
    b.awaken();
    ast(c.v==42);
    ast(b.v==2);
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
});

//@formatter:off

deftest('c?n',x=> {
    let a = C.cI(42)
        , b = C.cFI(c=> {
        return a.v / 2;
    })
        , c = C.cF(x=> {
        return b.v + 1
    });
    izz(x=> {
        diag = b.v;
        return b.v == 21
    });
    izz(x=> {
        return c.v == 22
    });

    b.v = 42;

    izz(x=> {
        diag=b.v;
        return b.v == 42
    });
    izz(x=> {
        return c.v == 43
    });
});

deftest('c?once',x=>{
    let a = C.cI(42)
        , b = C.cF1(c=>{ return a.v/2});

    izz(x=>{ diag = 'whoa';
        return b.v == 21});
    a.v = 2;
    izz(x=>{ return a.v==2});
    izz(x=>{diag=b.v;
        return b.v==21});
});

deftest('ephemeral', x=> {
    let b = C.cIe(null)
        , cn = 0
        , c = C.cF(c=> {
        return 'Hi ' + (b.v || '') + ' ' + (++cn)
    });
    ast(c.v == 'Hi  1');
    b.v='Mom';
    ast(b.v==null);
    ast(c.v=='Hi Mom 2');
    b.v='Mom';
    ast(b.v==null);
    ast(c.v=='Hi Mom 3');

});

deftest('lazy-true',()=>{
   let xo = 0
       , a = C.cI(0)
       , b = C.cF_(c=>{ ++xo;
                        return a.v+40;}
                        , {name:'c'});
    izz(x=>{ diag=a.pv;
        return b.pv == C.kUnbound;});
    izz(x=>{ return xo==0;});
    izz(x=>{ return b.v==40});
    izz(x=>{ return xo==1;});
    a.v==100;
    izz(x=>{ return a.v=100});
    izz(x=>{ return b.pv==40});
    izz(x=>{ return xo==1;});
    clg('confirm jit evic');
    izz(x=>{ diag=b.v;
        return b.v==140});
    izz(x=>{ return xo==2;});
});

deftest('lazy-until',jj=>{
    let xo=0
        , xr = 0
        , a = C.cI(0)
        , x = C.c_F(c=>{
            ++xr;
            return a.v + 40;});
    izz(c=>{ return x.pv==C.kUnbound});
    izz(c=>{ return xr == 0});
    izz(c=>{ return x.v == 40});
    izz(c=>{ return xr == 1});
    a.v = 2;
    izz(c=>{ return x.pv == 42});
    izz(c=>{ return x.v == 42});
})

deftest('opti-when',_=>{
   let xo = 0
       , xr = 0
       , a = C.cI(0)
       , x = C.cF(c=>{
            ++xr;
            let av = a.v;
            return (av > 1)? av+40:null;}
            , {optimize: C.kOptimizeWhenValued
           });
    ast(x.v==null);
    ast(x.validp());
    ast(x.useds.size==1);
    ast(a.callers.size==1);
    ast(!x.optimizedAwayp());
    a.v = 2;
    ast(a.v==2);
    izz(_=>{ diag = x.v;
        return x.v==42});
    izz(_=>{return x.optimizedAwayp()});
    a.v=3;
    ast(a.v==3);
    ast(x.v==42);
    ast(x.useds.size==0);
    ast(a.callers.size==0);
    ast(x.optimizedAwayp());
   });

//deftest('opti')
/*testRun('test-cI');
testRun('t-formula');
testRun('t-formula-2');
testRun('t-in-reset');*/
testRun('opti-when');
//testRun('c?n');
testRunAll();