/**
 * Created by Kenneth on 9/4/2016.
 */

H = require('../cHeader');
C = require('../Cell');
T = require('./tester');

T.deftest('lazy-true',()=>{
    let xo = 0
        , a = C.cI(0)
        , b = C.cF_(c=>{ ++xo;
            return a.v+40;}
        , {name:'c'});
    T.izz(x=>{ T.diag=a.pv;
        return b.pv == C.kUnbound;});
    T.izz(x=>{ return xo==0;});
    T.izz(x=>{ return b.v==40});
    T.izz(x=>{ return xo==1;});
    a.v==100;
    T.izz(x=>{ return a.v=100});
    T.izz(x=>{ return b.pv==40});
    T.izz(x=>{ return xo==1;});
    T.clg('confirm jit evic');
    T.izz(x=>{ diag=b.v;
        return b.v==140});
    T.izz(x=>{ return xo==2;});
});

T.deftest('lazy-until',jj=>{
    let xo=0
        , xr = 0
        , a = C.cI(0)
        , x = C.c_F(c=>{
        ++xr;
        return a.v + 40;});
    T.izz(c=>{ return x.pv==C.kUnbound});
    T.izz(c=>{ return xr == 0});
    T.izz(c=>{ return x.v == 40});
    T.izz(c=>{ return xr == 1});
    a.v = 2;
    T.izz(c=>{ return x.pv == 42});
    T.izz(c=>{ return x.v == 42});
});

T.testRun('lazy-true');
T.testRun('lazy-until');
T.clg('AOK');
//testRunAll();