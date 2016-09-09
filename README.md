# jCells

This is Clj/CLJS [Rube](https://github.com/kennytilton/rube/wiki) for Javascript. Rube was Common Lisp [Cells](https://github.com/kennytilton/cells/wiki) for Clojure.

So far I have pure Cells ported and DEFMODEL has taken significant baby steps.

I am looking at a fuller treatment of models than in Rube since Javascript has better support for objects than does Clojure. (You can define getters and setters and a constructor, things that matter for transparency -- and we like transparency.)

Next up, families and kids. That addresses the problem ReactJS is trying to solve* with their new work on [so-called contexts](https://facebook.github.io/react/docs/context.html), and which lots of folks are trying to solve with databinding and/or FRP, viz., how do I neatly adjust my own state (color, enabledness, label) based on the state of other widgets? eg, I am the "Delete All" button. I should not be enabled (or perhaps appear) unless something else somewhere has been selected. Wait, I have gotten ahead of myself...

[* They seem a little half-hearted about it: "Using context will make your code harder to understand because it makes the data flow less clear" and "if you have to use context, use it sparingly" and "try to isolate your use of context to a small area" and "if you are just getting started with React, you likely do not want to use context". OK, quarter-hearted.]

Once I have families interdependent (2016-09-09?) I will start on jWeb, a web application framework involving nothing but HTML and CSS. And jCells, but that is no harder to learn than VisiCalc. (Look it up.) I have done this before in MCL, Windows GDK, Tcl/Tk, OpenGL, qooxdoo and qooxdoo mobile so it should go well, especially since the HTML and CSS will be your problem. I mean that in a good way.

jWeb will be different than most frameworks, because it works inside out instead of outside in.

With other frameworks one effectively must learn a new computer language. One also ends up with a tool chain to convert the outer framework source into runnable HTML/JS. And, in the case of ReactJs, one ends up adding Flux to manage state. Lots of libraries (including my pet JS library, [qooxdoo](http://www.qooxdoo.org/);

With jWeb we will simply have a runtime JS library that looks and works exactly like HTML and CSS and turn the designer loose. Inside will be the jCells dataflow driving conventional HTML, CSS, and AJAX (HCA) which methinks will turn out to be fine tools once harnassed transparently enough that we think we are just doing HCA while successfully building a web app. 

That paragraph needs work. The problem is that my cherished reader has no clue what it is like programming with Cells, so that paragraph -- why even try? Just wait for the Hello World tutorial.

Nice bonus with jWeb is that graphic designers will be able to program it themselves. (It will be easier than CSS.) I like the idea of kids in school learning programming this way, too.

Methinks a deep dive will be needed (by moiself) on CSS to help non-designers have fun with jWeb. Or I might just do jQx with my old friend qooxdoo, a superfine and rich JS library: http://www.qooxdoo.org/. Check out my qooxlisp and [Qxia](https://github.com/kennytilton/qxia/wiki) repos to see how Cells can eliminate a lot of the coding qooxdoo requires.

Right now I am putting the finishing touches on DEFMODEL 1.0 and hope to start jWeb tomorrow. Tuned stay.


