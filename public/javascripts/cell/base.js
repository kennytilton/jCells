/**
 * Created by kenneth on 8/29/16.
 *
 * Following the structure of the Clojure/CLJS Rube library
 *
 */

var que = require('../util/queue');
var trx = require('../util/trc');
/*
var s = new que.Stack(0,1), e;
s.push(2);
console.log(s.getLength()); // 3
while(undefined!==(e=s.pop()))
    console.log('coolio '+e);

function assert(value, message) {
    if (!value) {
        throw message;
    }
}

function is(a, b, name) {
    assert(a === b, name + ": " + a + " isn't " + b);
}

function qtest(Queue) {
    var queue = new Queue();
    queue.push("a");
    queue.push("b");
    queue.push("c");
    is(queue.shift(), "a", Queue.name);
    is(queue.shift(), "b", Queue.name);
    is(queue.shift(), "c", Queue.name);
    console.log('qtest ok '+ Queue)
}

qtest(que.ArrayQueue);
*/

var pulse = 0;

function cellsInit () {
    pulse = 0;
}

var causation = new que.Stack();

var callStack = new que.Stack();

var depender = null;

var deferChanges = false;

var clientQHandler = null;

var unbound = "_ubd-cell-value_";

var uncurrent = "_uncurrent-formulaic-value_";

var gNotToBe = false;

var gUnfinishedBusiness = null;

var gWithinIntegrity = false;

var gFinbizId = 0;

var gCPropDepth = 0;

var gCDebug = false;

var gStop = false ;; emergency brake

/* put this with cell

function pcell (tag, c) {
    trx/clog('pcell> '+ tag, c.slot, c.state, c.val);
}

*/
// --- procedure division ----------------------


function cellsReset (options) {
    var options = Object.assign({}
        , {debug: false}
        , (typeof options === 'undefined') ?
        {} : options);
    gCDebug = options.debug;
    gClientQHandler = options.clientQHandler;
    cellsInit();
}

function withoutCDependency (fn) {
    var save = gDepender;
    gDepender = null;
    try {
        fn();
    } finally {
        gDepender = save;
    }
}

function myCause ()
    return gCausation.peek();
}

function cStopper (why) {
    gStop = why;
}

var gStopper = cStopper;

function cStop (why) {
    gStopper((typeof why === undefined) ? 'unknown' : why);
}

function cStopped() {
    return gStop !== null;
}

/*
(defn ustack$ [tag] ;; debug aid
  (str tag "ustack> "(vec (map (fn [c] (:slot @c)) *call-stack*))))

(defn c-assert
  ([assertion] (when-not assertion
                 (ut/err "c-assert anon failed")))
  ([assertion fmt$ & fmt-args]
   (when-not +stop+
           (when-not assertion
                   (apply #'ut/err (str "c-assert> " fmt$ fmt-args))))))

(defn c-break [& args]
  (when-not +stop+
    (ut/err (str args))))

(defn c-warn [& args]
  (when-not +stop+
    (println (apply str "WARNING: " args))))

;; ------------------------------------------------------

/*
(derive ::model ::object)
(derive ::cell ::object)
(derive ::c-formula ::cell)

(defn ia-type [it]
 #?(:clj (type it)
    :cljs (cond
            (instance? cljs.core.Atom it)
            (:type (meta it))
            :default (type it))))

(defn ia-type? [it typ]
  (isa? (ia-type it) typ))

(defn c-formula? [c]
  (ia-type? c ::c-formula))

(defn c-ref? [x]
  (ia-type? x ::cell))

(def-rmap-slots c-
  me slot state input? rule pulse pulse-last-changed pulse-observed
  useds users callers optimize ephemeral?
  lazy synaptic?)

(defn c-value [c]
  (assert (any-ref? c))
  (cond
    (and (c-ref? c)
         (map? @c)) (:value @c)
    :else @c))

(defn c-optimized-away? [c]
  (cond
    (c-ref? c) (or (not (map? @c))
                   (= :optimized-away (:state @c)))
    :else true))

(defn c-model [rc]
  (:me @rc))

(defn c-md-name [c]
  (if-let [md (c-model c)]
    (or (:name @md)
      "anon")
    "no-md"))

(defn c-slot-name [rc]
  (:slot @rc))

(defn c-value-state [rc]
  (let [v (c-value rc)]
    (cond
      (= v unbound) :unbound
      (= v uncurrent) :uncurrent
      :else :valid)))

(defn c-unbound? [rc]
  (= :unbound (c-value-state rc)))

(defn c-valid? [rc]
  (= :valid (c-value-state rc)))

;; --- dependency maintenance --------------------------------

(defn caller-ensure [used new-caller]
  (#?(:clj alter :cljs swap!)
   used assoc :callers (conj (c-callers used) new-caller)))

(defn caller-drop [used caller]
  (#?(:clj alter :cljs swap!)
   used assoc :callers (disj (c-callers used) caller)))

(defn unlink-from-callers [c]
  (for [caller (c-callers c)]
    (caller-drop c caller))
  (rmap-setf [:callers c] nil))

;; debug aids --------------

(defn c-slots [c k]
  (assert (c-ref? c))
  (set (map c-slot (k @c))))

;; --- defmodel rizing ---------------------

(defn md-ref? [x]
  ;;(trx :md-ref?-sees x)
  (and (instance? #?(:cljs cljs.core.Atom
                :clj clojure.lang.Ref)  x)
       ;; hhack (ia-type? x ::model)
       ))

;; --- mdead? ---

(defmulti mdead? (fn [me]
                   (assert (or (nil? me)
                               (md-ref? me)))
                   [(type (when me @me))]))

(defmethod mdead? :default [me]
  false)

;;---

#?(:cljs (set! *print-level* 3)) ;; cells are recursive data for now

(defn md-slot-owning? [class-name slot-name]
  ;; hhack
  false)

*/