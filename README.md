# jCells

This is Rube (https://github.com/kennytilton/rube/wiki) for Javascript. Rube was Cells for Clojure.

So far I have pure Cells ported and DEFMODEL has taken significant baby steps.

I am looking at a fuller treatment of models than in Rube since Javascript has better support for objects than does Clojure. (You can define getters and setters and a constructor, things that matter for transparency -- and we like transparency.)

Next up, families and kids.

Then I will turn it into jWeb, a web application framework involving nothing but HTML and CSS. And jCells, but that is no harder to learn than VisiCalc. (Look it up.) I have done this before in MCL, Windows GDK, Tcl/Tk, OpenGL, qooxdoo and qooxdoo mobile so it should go well, especially since the HTML and CSS will be your problem. I mean that in a good way.

jWeb will be different than most frameworks, because it works inside out instead of outside in.

With other frameworks one effectively must learn a new computer language. One also ends up with a tool chain to convert the outer framework source into runnable HTML/JS. And, in the case of ReactJs, one ends up adding Flux to manage state.

With jWeb we just create a runtime JS library that looks and works exactly like HTML and CSS and turn the designer loose. Inside will be the jCells dataflow driving conventional HTML, CSS, and AJAX (HCA) which methinks will turn out to be fine tools once harnassed transparently enough that we think we are just doing HCA while successfully building a web app. This paragraph needs work.

Nice bonus is that graphic designers should be able to work with this.

Methinks a deep dive will be needed (by moiself) on CSS to help non-designers have fun with jWeb. Or I might just do jQx with my old friend qooxdoo, a superfine and rich JS library: http://www.qooxdoo.org/. Check out my qooxlisp and qxia repos to see how Cells can eliminate a lot of the coding qooxdoo requires.


