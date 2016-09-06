C = require('../Cell');
T = require('./tester');

//@formatter:off

T.deftest('HelloWorld', x=>{
    let obsAction = (_,me,newv)=>{
        if (newv) clg('visitor did',newv);
    }
    , v = {name: 'World'
        , action: C.cIe(null, {name: 'v-action'
                            , observer: obsAction})}
    , rAction = C.cIe(null)
    , rLoc = C.cF(c=>{
        switch (rAction.v) {
            case 'leave': return 'away';
        break;
            case 'return': return 'home';
        break;
            default: return 'missing';
        }}, {observer: (slot,me,newv)=>{
                    if (newv) {
                        T.clg(`Honey, Im ${newv}`);
                    }}})
    , rResponse = C.cF(c=>{
        if (rLoc.v == 'home') {
            let act = v.action.v;
            if (act=='knock-knock')
                return 'Hello, world.'
        }}, {ephemeralp: true
            , observer: (slot,me,newv)=>{
                if (newv) {
                    T.clg(`rResponse = ${newv}`);
                }}})
    , alarm = C.cF(c=>{return rLoc.v=='home'? 'off':'on'}
                    ,{observer: (s,me,newv)=>{T.clg(`Sending ${newv} to alarm API`)}});
    rResponse.awaken();
    T.izz(z=>{ return rLoc.v=='missing'});
    T.izz(z=>{ return alarm.v=='on'});

    v.action.v = 'knock-knock';
    rAction.v = 'return';
    v.action.v = 'knock-knock';
    T.izz(z=>{ return rResponse.v==null})
});

T.testRun('HelloWorld');