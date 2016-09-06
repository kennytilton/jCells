
C = require('../Cell');
T = require('./tester');

//@formatter:off

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

T.deftest('ephormula',x=>{
    let act = C.cIe(null)
        , obsr = null
        , response = C.cF(c=>{
            switch (act.v) {
                case 'knock-knock':
                    return 'Hello, world.';
                break;
                default:
                    return 'Silence';
            }}, {name: 'respo'
                , ephemeralp: true
                , observer: (n,_,newv)=>{
                    obsr = newv;
                    T.clg('obs respo',n,newv)}});
    T.izz(x=> {return response.v=='Silence'});
    T.izz(x=> {return obsr=='Silence'});
    T.izz(x => {
        T.setDiag(response.pv);
        T.clg('hi mom ', T.diag);
        return !response.pv;});
    act.v = 'knock-knock';
    T.ast(response.pv==null);
    T.ast(act.v==null);

});

T.testRun('ephormula');
// T.testRun('ephemeral');
T.testRunAll();