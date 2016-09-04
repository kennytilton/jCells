/*

Objective:

*/

defmd('Person'
    , {slots: {dbg: 'anon', cache: null, bday: Date.now()}
        , cells: {
            weight: C.cI(165)
            , height: 70
            , bmi: C.cF}
    }


