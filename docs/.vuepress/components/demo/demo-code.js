/eslint-plugin[-regexp]/u

// Optimize and Simplify

var re = /[0-9][^\s]/iu;
var re = /[\w\p{ASCII}]/u;
var re = /^\w[_A-Z\d]*\e{1,}/i;

var re = /(?:\w|\d){1,}/;
var re = /(?<!\w)a+(?=$)/mi;
var re = /[\s\S]#[\0-\uFFFF]/yi;
var re = /\d*\w(?:[a-z_]|\d+)*/im;

// Detect problems

var re = /\1(a)/;
var re = RegExp('[a-z]+' + '|Foo', 'i');
