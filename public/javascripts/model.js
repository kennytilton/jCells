/**
 * Created by kenneth on 9/4/16.
 */

//@formatter:off

function clg() {
    console.log(Array.from(arguments).join(","));
}
function ast (test, msg) {
    console.assert(test,msg);
}

var UU = require('node-uuid');

/*
 defmd('Person'
 , {slots: {dbg: 'anon', cache: null, bday: Date.now()}
 , cells: {
 weight: C.cI(165)
 , height: 70
 , bmi: C.cF}
 }

 Methinks step one is to create a Model (or model-object) class that
 knows about self-awakening, installing cells, etc, such that we can
 at least create an instance under the necessary constructor/md-awaken.

 That might be enough, but inheritance can be handled later. Unless it just falls into place.

 In between we let the user worry about inheritance and then bless any given Class
 instance with model-ness.

 */