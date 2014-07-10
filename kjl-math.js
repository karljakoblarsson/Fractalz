/* kjl-Math
 * assorted missing math functions for js.
 * graphics related mostly.
 * mostly with bad implementations. :P
 
 * Karl Jakob Larsson 2014
 * k.jakob.larsson@gmail.com
 * MIT License
 */
 
var rand = function(min, max) {
    return Math.random() * (max - min) + min;
};
var round = Math.round;
var floor = Math.floor;
var pow = Math.pow;
var log = Math.log;
function x(p) { return p[0]; };
function y(p) { return p[1]; };

function sum(vec) {
    return vec.reduce(function(a,b) {return a+b;});
}
function norm(vec) {
    return Math.sqrt(sum(vec));
}

function normalize(vec) {
    return vec.map(function(elem) {return elem / sum(vec); });
}

function affine(p, a, b, c, d, e, f) {
    var x = p[0];
    var y = p[1];
    return [a*x + b*y + c, d*x + e*y + f];
}

Int32Array.prototype.reduce = function(fn) {
    var ans = this[0];
    for (var i = 1; i < this.length; i++) {
        ans = fn(this[i], ans);
    }
    return ans;
};