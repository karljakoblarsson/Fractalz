/* Fractal flame in javascript + canvas.
 * Karl Jakob Larsson 2014
 * MIT License
 */

/* Variations
 *
 */

var variations = (function() {
    function r2(p) { return  pow(x(p), 2) + pow(y(p), 2); }
    function r(p) { return Math.sqrt(r2(p)); };
    function theta(p) { return Math.atan( x(p) / y(p) ); }
    function phi(p) { return Math.atan( y(p) / x(p) ); };

    return {
        0: function(p) {return p;},  // linear
        1: function(p) {return [ Math.sin( x(p) ), Math.sin(y(p)) ];}, // sinusiodial
        2: function(p) {var s = 1/r2(p); return [ x(p)*s , y(p)*s ];}, // spherical
  };
})();
