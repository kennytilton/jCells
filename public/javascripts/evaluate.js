/**
 * Created by kenneth on 9/1/16.
 */

var C = require('./cell');
var H = require("./cHeader.js");

function clg () {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
}
function ast (test, msg) {
    console.assert(test,msg);
}




/*




(defn calculate-and-link
"The name is accurate: we do no more than invoke the
rule of a formula and return its value, but along the
way the links between dependencies and dependents get
determined anew."
    [c]
(binding [*call-stack* (cons c *call-stack*)
*depender* c
*defer-changes* true]
(unlink-from-used c :pre-rule-clear)
(assert (c-rule c) (#?(:clj format :cljs str) "No rule in %s type %s" (:slot c)(type @c)))
((c-rule c) c)))

;;; --- awakening ------------------------------------

    (defmulti c-awaken (fn [c]
#?(:clj (type c)
:cljs (:type (meta c)))))

(defmethod c-awaken :default [c]
;;(trx :awk-fallthru-entry (type c)(seq? c)(coll? c)(vector? c))
(cond
(coll? c) (doall (for [ce c]
(c-awaken ce)))
:else
(println :c-awaken-fall-thru (if (any-ref? c)
    [:ref-of (type c) @c]
[:unref c (type c)]))))

(defmethod c-awaken ::cty/cell [c]
(assert (c-input? c))
;
; nothing to calculate, but every cellular slot should be output on birth
;
;; (trx :awk-input (c-slot c)@+pulse+ (c-pulse-observed c))
(#?(:clj dosync :cljs do)
    (when (> @+pulse+ (c-pulse-observed c)) ;; safeguard against double-call
(when-let [me (c-me c)]
(rmap-setf [(c-slot c) me] (c-value c)))
(c-observe c :cell-awaken)
(ephemeral-reset c))))

(defmethod c-awaken ::cty/c-formula [c]
(#?(:clj dosync :cljs do)
    ;; hhack -- bundle this up into reusable with evic
    ;; (trx :c-formula-awk (c-slot c)(c-current? c))
(binding [*depender* nil]
(when-not (c-current? c)
(calculate-and-set c :fn-c-awaken nil)))))

;; ------------------------------------------------------------

    (declare c-absorb-value
optimize-away?!
    propagate
    c-value-changed?)


(defn md-slot-value-store [me slot value]
(assert me)
(assert (any-ref? me))
;(trx :mdsv-store slot (flz value))
(rmap-setf [slot me] value))

(defn c-value-assume
"The Cell assumes a new value at awakening, on c-reset!, or
after formula recalculation.

    We record the new value, set the Cell state to :awake, make
its pulse current, check to see if a formula cell can be
optimized away, and then propagate to any dependent formula
cells."

    [c new-value propagation-code]

(assert (c-ref? c))
(do ;; (wtrx (0 100 :cv-ass (:slot @c) new-value)
(prog1 new-value ;; sans doubt
(without-c-dependency
    (let [prior-value (c-value c)
prior-state (c-value-state c)]

;; --- cell maintenance ---
;; hhhack: new for 4/19/2016: even if no news at
;; least honor the reset!
;;
(rmap-setf [:value c] new-value)
(rmap-setf [:state c] :awake)
#_(trx :new-vlue-installed (c-slot c)
new-value
(:value c))
;;
;; --- model maintenance ---
(when (and (c-model c)
(not (c-synaptic? c) ))
(md-slot-value-store (c-model c) (c-slot-name c) new-value))

(c-pulse-update c :slotv-assume)

(when (or (= propagation-code :propagate) ;; forcing
(not (some #{prior-state} [:valid :uncurrent]))
(c-value-changed? c new-value prior-value))
;;
;; --- something happened ---
;;
;; we may be overridden by a :no-propagate below, but anyway
;; we now can look to see if we can be optimized away
(let [callers (c-callers c)] ;; get a copy before we might optimize away
(when-let [optimize (and (c-formula? c)
    (c-optimize c))]
(trx nil :wtf optimize)
(case optimize
    :when-value-t (when (c-value c)
(trx nil :when-value-t (c-slot c))
(unlink-from-used c :when-value-t))
true (optimize-away?! c prior-value)))

;; --- data flow propagation -----------
    (when-not (or (= propagation-code :no-propagate)
(c-optimized-away? c))
(assert (map? @c))
(propagate c prior-value callers)))))))))


;; --- unlinking ----------------------------------------------
    (defn unlink-from-used [c why]
"Tell dependencies they need not notify us when they change,
then clear our record of them."
(for [used (c-useds c)]
(do
    (rmap-setf [:callers used] (disj (c-callers used) c))))

(rmap-setf [:useds c] #{}))

(defn md-cell-flush [c]
(assert (c-ref? c))
(when-let [me (c-model c)]
(rmap-setf [:cells-flushed me]
(conj (:cells-flushed me)
[(c-slot c)(c-pulse-observed c)]))))

;; --- optimize away ------------------------------------------
;; optimizing away cells who turn out not to depend on anyone
;; saves a lot of work at runtime.


(defn optimize-away?!
    "Optimizes away cells who turn out not to depend on anyone,
    saving a lot of work at runtime. A caller/user will not bother
establishing a link, and when we get to models cget will
find a non-cell in a slot and Just Use It."

    [c prior-value]
(when (and (c-formula? c)
(empty? (c-useds c))
(c-optimize c)
(not (c-optimized-away? c)) ;; c-streams (FNYI) may come this way repeatedly even if optimized away
(c-valid? c) ;; /// when would this not be the case? and who cares?
(not (c-synaptic? c)) ;; no slot to cache invariant result, so they have to stay around)
(not (c-input? c)) ;; yes, dependent cells can be inputp
)
(rmap-setf [:state c] :optimized-away) ;; leaving this for now, but we toss
; the cell below. hhack
(c-observe c prior-value :opti-away)
(when-let [me (c-model c)]
#_(when (= :login (:name @me))
(println :opti-away-nails-cz!!!!!!!!!! (c-slot c)))

(rmap-meta-setf [:cz me] (assoc (:cz (meta me)) (c-slot c) nil))
(md-cell-flush c))

;; let callers know they need not check us for currency again
(doseq [caller (seq (c-callers c))]
(#?(:clj alter :cljs swap!) caller assoc :useds (remove #{c} (c-useds caller)))
(caller-drop c caller)
;;; (trc "nested opti" c caller)
;;(optimize-away?! caller) ;; rare but it happens when rule says (or .cache ...)
(ensure-value-is-current caller :opti-used c)) ;; this will get round to optimizing
; them if necessary, and if not they do need
; to have one last notification if this was
; a rare mid-life optimization

;;(trx :opti-nailing-c-map!!!!!!! (c-slot c))
(#?(:clj ref-set :cljs reset!) c (c-value c))
))

;; --- c-quiesce -----------

    (defn c-quiesce [c]
(assert c)
(unlink-from-callers c)
(unlink-from-used c :quiesce)
(#?(:clj ref-set :cljs reset!) c :dead-c))

;; --- not-to-be --


(defmulti not-to-be (fn [me]
(assert (md-ref? me))
    [(type (when me @me))]))

(defmethod not-to-be :default [me]
(doseq [c (vals (:cz (meta me)))]
(when c ;; not if optimized away
(c-quiesce c)))
(#?(:clj ref-set :cljs reset!) me nil)
(rmap-meta-setf [:state me] :dead))

;----------------- change detection ---------------------------------

    (defmulti unchanged-test
"Cells does not propagate when nothing changes. By default, the
test is =, but cells can inject a different test, and when we get
to models it will be possible for a slot to have associated
with it a different test."

(fn [me slot]
[(when me (type @me)) slot]))


(defmethod unchanged-test :default [self slotname]
    =)

(defn c-value-changed? [c new-value old-value]
(not ((or (:unchanged-if @c)
(unchanged-test (c-model c) (c-slot c)))
new-value old-value)))

;;--------------- change propagation  ----------------------------

    (def ^:dynamic *custom-propagater* nil)

(declare propagate-to-callers

md-slot-cell-flushed)

(defn propagate
"A cell:
- notifies its callers of its change;
- calls any observer; and
- if ephemeral, silently reverts to nil."

;; /do/ support other values besides nil as the "resting" value

    [c prior-value callers]

(trx nil :propagate (:slot @c))

(cond
*one-pulse?* (when *custom-propagater*
(*custom-propagater* c prior-value))
;; ----------------------------------
:else
(do
    (rmap-setf [:pulse-last-changed c] @+pulse+)

(binding [*depender* nil
*call-stack* nil
*c-prop-depth*  (inc *c-prop-depth*)
*defer-changes* true]
;; --- manifest new value as needed ---
;;
;; 20061030 Trying not.to.be first because doomed instances may be interested in callers
;; who will decide to propagate. If a family instance kids slot is changing, a doomed kid
;; will be out of the kids but not yet quiesced. If the propagation to this rule asks the kid
;; to look at its siblings (say a view instance being deleted from a stack who looks to the psib
;; pb to decide its own pt), the doomed kid will still have a parent but not be in its kids slot
;; when it goes looking for a sibling relative to its position.
(when (and prior-value
(c-model c)
(md-slot-owning? (type (c-model c)) (c-slot-name c)))
(when-let [ownees (difference (set-ify prior-value) (set-ify (c-value c)))]
(doseq [ownee ownees]
(not-to-be ownee))))

(propagate-to-callers c callers)
(trx nil :obs-chkpulse!!!!!!!! @+pulse+ (c-pulse-observed c))
(when (or (> @+pulse+ (c-pulse-observed c))
(some #{(c-lazy c)}
    [:once-asked :always true])) ;; messy: these can get setfed/propagated twice in one pulse+
(c-observe c prior-value :propagate))

;;
;; with propagation done, ephemerals can be reset. we also do this in c-awaken, so
;; let the fn decide if C really is ephemeral. Note that it might be possible to leave
;; this out and use the pulse to identify obsolete ephemerals and clear them
;; when read. That would avoid ever making again bug I had in which I had the reset
;; inside slot-value-observe,
;; thinking that that always followed propagation to callers. It would also make
;; debugging easier in that I could find the last ephemeral value in the inspector.
;; would this be bad for persistent CLOS, in which a DB would think there was still a link
;; between two records until the value actually got cleared?
;;
(ephemeral-reset c)))))

(defn propagate-to-callers [c callers]
;;
;;  We must defer propagation to callers because of an edge case in which:
    ;;    - X tells A to recalculate
;;    - A asks B for its current value
;;    - B must recalculate because it too uses X
;;    - if B propagates to its callers after recalculating instead of deferring it
;;       - B might tell H to reclaculate, where H decides this time to use A
;;       - but A is in the midst of recalculating, and cannot complete until B returns.
;;         but B is busy eagerly propagating. "This time" is important because it means
;;         there is no way one can reliably be sure H will not ask for A
    ;;
                                                                       (when-not (empty? callers)
                                                                       (let [causation (cons c *causation*)] ;; closed over below
(with-integrity (:tell-dependents c)
(if (mdead? (c-model c))
(do (trx "WHOAA!!!! dead by time :tell-deps dispatched; bailing" c))
(binding [*causation* causation]
(doseq [caller (seq callers)]
(cond
(or  ;; lotsa reasons NOT to proceed
(= (c-state caller) :quiesced)
(c-current? caller) ;; happens if I changed when caller used me in current pulse+
(some #{(c-lazy caller)} [true :always :once-asked])

(and (not (some #{c} (c-useds caller))) ; hard to follow, but it is trying to say
(not (c-optimized-away? c))))       ; "go ahead and notify caller one more time
; even if I have been optimized away cuz they need to know."
; Note this is why callers must be supplied, having been copied
; before the optimization step.
(trx nil :not-propping (c-slot c) :to (c-slot caller))
:else
(calculate-and-set caller :propagate c)))))))))


:evaluate-ok

*/