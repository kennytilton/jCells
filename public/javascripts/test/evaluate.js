H = require('../cHeader');
C = require('../Cell');
T = require('./tester');

//@formatter:off

T.deftest('test-cI', () => {
    let c = C.cI(42);
    T.ast(c instanceof C.Cell);
    T.izz(() => {return c instanceof C.Cell});
    T.izz(() => {return c.valueState() == C.kValid});
    T.izz(() => {return c.callers instanceof Set});
    T.izz(() => {return !c.callers.size});
    T.izz(() => {return c.inputp});
    T.izz(() => {return c.validp()});
    T.izz(() => {return c.v==42});
});

T.deftest('t-formula', ()=>{
    let c = C.cF(() => {return 40 + 2});
    c.name='c';
    T.izz(() => {return c instanceof C.Cell});
    T.izz(() => {return c.valueState()==C.kUnbound});

    T.izz(() => {return T.callerct(c)==0});
    T.izz(() => {return T.usedct(c)==0});
    T.izz(() => {return !c.validp()});

    T.izz(() => {return c.v == 42});

    T.izz(() => {return T.callerct(c)==0});
    T.izz(() => {return T.usedct(c)==0});
    T.izz(() => {return c.validp()});
});


T.deftest( 't-formula-2', ()=>{
    let b = C.cI(2)
    , cct = 0
    , dct = 0
    , c = C.cF(()=> { ++cct; return 40 + b.v;})
    , d = C.cF(() => { ++dct; return b.v + c.v;});
    T.ast(b.useds.size==0);
    T.izz(() => {return b.v == 2});
    T.izz(() => {return c.v == 42});
    T.izz(() => {return d.v == 44});
    T.izz(() => {return cct == 1});
    T.izz(() => {return dct == 1});
    T.izz(() => {return T.usedct(b) == 0});
    T.izz(() => {return T.callerct(b) == 2});
    T.izz(() => {return T.usedct(c) == 1});
    T.izz(() => {return T.callerct(c) == 1});
    T.izz(() => {return T.usedct(d) == 2});
    T.izz(() => {return T.callerct(d) == 0});
});

T.deftest( 't-in-reset', ()=>{
    let yowza = 0
        , obsct = 0
        , b = C.cI(2, {'name' : 'bb'
                   , 'observer' : (n, m, nv) => {
                       ++obsct;
                       //T.clg('bb obs!!', obsct, nv, ov||'nada');
                        yowza = nv}});

    T.izz(()=>{return b.name=='bb'});
    T.izz(()=>{return obsct==0});
    b.awaken();
    T.izz(()=>{diag = obsct; return obsct==1});
    //T.clg('ass same');
    b.v = 2;
    //T.clg('assed same');
    T.izz(()=>{diag = obsct; return obsct==1});
    T.izz(() => {return yowza==2});
    b.v = 42;
    T.izz(()=>{return obsct==2});
    T.izz(() => {return b.v==42});
    T.izz(() => {return yowza==42});
        });

T.deftest('t-formula-22', ()=>{
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

    T.izz(()=> {return d.v==44});
    T.izz(()=> {return c.v==42});
    T.izz(()=> {return b.v==2});
    T.izz(()=> {return dct==1});
    T.izz(()=> {return cct==1});
    b.v=3;
    T.izz(()=> {return d.v==46});
    T.izz(()=> {return c.v==43});
    T.izz(()=> {return b.v==3});
    T.izz(()=> {return dct==2});
    T.izz(()=> {return cct==2});
});


T.deftest('opti-away',()=>{
    let aa = C.cF(()=>{return 42;});
    aa.awaken();
    T.izz(()=>{
        diag='aaa';//aa.v;
        return aa.v==42;
    });
    T.izz(()=>{
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
T.deftest('unchanged',()=>{
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
    T.ast(c.v==42);
    T.ast(b.v==2);
    T.ast(ob==1);
    T.ast(cct==1);
    b.v = 4;
    T.ast(c.v==42);
    T.ast(b.v==4);
    T.ast(ob==1);
    T.ast(cct==1);

    b.v = 5;
    T.ast(c.v==45);
    T.ast(b.v==5);
    T.ast(ob==2);
    T.ast(cct==2);
});

//@formatter:off

T.deftest('c?n',x=> {
    let a = C.cI(42)
        , b = C.cFI(c=> {
        return a.v / 2;
    })
        , c = C.cF(x=> {
        return b.v + 1
    });
    T.izz(x=> {
        diag = b.v;
        return b.v == 21
    });
    T.izz(x=> {
        return c.v == 22
    });

    b.v = 42;

    T.izz(x=> {
        diag=b.v;
        return b.v == 42
    });
    T.izz(x=> {
        return c.v == 43
    });
});

T.deftest('c?once',x=>{
    let a = C.cI(42)
        , b = C.cF1(c=>{ return a.v/2});

    T.izz(x=>{ diag = 'whoa';
        return b.v == 21});
    a.v = 2;
    T.izz(x=>{ return a.v==2});
    T.izz(x=>{diag=b.v;
        return b.v==21});
});

T.deftest('ephemeral', x=> {
    let b = C.cIe(null)
        , cn = 0
        , c = C.cF(c=> {
        return 'Hi ' + (b.v || '') + ' ' + (++cn)
    });
    T.ast(c.v == 'Hi  1');
    b.v='Mom';
    T.ast(b.v==null);
    T.ast(c.v=='Hi Mom 2');
    b.v='Mom';
    T.ast(b.v==null);
    T.ast(c.v=='Hi Mom 3');

});



T.deftest('opti-when',_=>{
   let xo = 0
       , xr = 0
       , a = C.cI(0)
       , x = C.cF(c=>{
            ++xr;
            let av = a.v;
            return (av > 1)? av+40:null;}
            , {optimize: C.kOptimizeWhenValued
           });
    T.ast(x.v==null);
    T.ast(x.validp());
    T.ast(x.useds.size==1);
    T.ast(a.callers.size==1);
    T.ast(!x.optimizedAwayp());
    a.v = 2;
    T.ast(a.v==2);
    T.izz(_=>{ diag = x.v;
        return x.v==42});
    T.izz(_=>{return x.optimizedAwayp()});
    a.v=3;
    T.ast(a.v==3);
    T.ast(x.v==42);
    T.ast(x.useds.size==0);
    T.ast(a.callers.size==0);
    T.ast(x.optimizedAwayp());
   });

//T.deftest('opti')
/*T.testRun('test-cI');
T.testRun('t-formula');
T.testRun('t-formula-2');
T.testRun('t-in-reset');*/
T.testRun('opti-when');
//T.testRun('c?n');
T.testRunAll();