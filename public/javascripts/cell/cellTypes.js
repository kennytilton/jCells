/**
 * Created by kenneth on 8/29/16.

Cells -- Automatic Dataflow Managememnt

 **/

var que = require('../util/queue');

funtion Cell ()
{
    this.md = null;
    this.slot = null;
    this.value = null;
    this.inputp = true;
    this.synaptic = false;
    this.callers = new que.ArrayQueue;
    this.state = 'nascent'; // or awake or optimized-away
    this.valueState = 'ubd-value-state';
    // or :unevaluated | :uncurrent | :valid
    this.uncurrent = false;
    this.pulse = 0;
    this.pulseLastChanged = 0;
    this.pulseObserved = 0;
    this.lazyp = false;
    this.optimizep = true;
    this.debugp = false;
    this.prt = function (c) {
                    ut/clog('Cell',c.slot,s.value,c.state,c.pulse
                            ,c.model.name.erestp,c.currentp);
    }
}

function cRuled (rule) {
    this.rule = withoutCDependency(this, rule);
}

function cDependent (rule) {
    this.useds = [];
    this.users = [];
}
(defun c-validp (c)
(eql (c-value-state c) :valid))

(defun c-unboundp (c)
(eql :unbound (c-value-state c)))


;__________________

(defmethod c-print-value ((c c-ruled) stream)
(format stream "~a" (cond ((c-validp c) (cons (c-value c) "<vld>"))
((c-unboundp c) "<unb>")
((not (c-currentp c)) "dirty")
(t "<err>"))))

(defmethod c-print-value (c stream)
(declare (ignore c stream)))

