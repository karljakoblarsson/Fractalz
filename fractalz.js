/* Fractal flame in javascript + canvas.
 * Karl Jakob Larsson 2014
 * MIT License
 */

/* TODO:
 * Refractor drawIFS() into smaller fns. To be able to profile.
 * Adjust colors
 *   - Gamma adjustment
 *   - Vibrancy
 * Final and Post transforms
 * Multiple weighted flames
 * Multistage computation and display.
 * Flame loading
 */

var canvas = document.getElementById("a");
canvas.width *= window.devicePixelRatio; // high-dpi adjustment
canvas.height *= window.devicePixelRatio;
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // The algorithm takes care of it.


// Convinience
var rand = function(min, max) {
    return Math.random() * (max - min) + min;
};
var round = Math.round;
var floor = Math.floor;
var pow = Math.pow;
var w = canvas.width;
var h = canvas.height;
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

function makeColor(data, index, rgba) {
    data[index] = rgba[0];
    data[index+1] = rgba[1];
    data[index+2] = rgba[2];
    data[index+3] = rgba[4] || 1;
}

function addToHist(data, index, rgba) {
    index *= 4;
    data[index] += rgba[0];
    data[index+1] += rgba[1];
    data[index+2] += rgba[2];
    data[index+3] += rgba[4] || 1;
}

function affine(p, a, b, c, d, e, f) {
    var x = p[0];
    var y = p[1];
    return [a*x + b*y + c, d*x + e*y + f];
}


// Define the coordinate-space of the display.
// The current fractal live in 0<x|y<1
var space = {x_min: -1,
             y_min: -1,
             x_max: 1,
             y_max: 1
            };

// Transform from coordinate-space to screen-space.
function coToPix(p) {
    var x_len = (space.x_max - space.x_min);
    var y_len = (space.x_max - space.x_min);

    return [round((p[0] - space.x_min)*w / x_len), 
            round(h - (p[1] - space.y_min)*h / y_len)];
}

function pixToIndex(p) {
    return (p[1] * w + p[0]);
}

var palette = palette1;

/*function palette(v) {
    if (v < 2) {return [0,0,0];}
    else if (v < 100) {return [v/2,v*4,v*2];}
    else if (v < 190) {return [v*8,v,255-v];}
    else { return [255, 255, v];}
}*/

Int32Array.prototype.reduce = function(fn) {
    var ans = this[0];
    for (var i = 0; i < this.length; i++) {
        ans = fn(this[i], ans);
    }
    return ans;
};

function drawIFS(ctx){
    // I desperatly need a new datastruct for the xforms.
    // but first, colors!
    var fns = [
        function(x) { return variations[0]( affine(x, 1/2, 0, 0, 0, 1/2, 0) );},
        function(x) { return variations[1]( affine(x, 1/2, 0, 2, 0, 1/2, 0) );},
        function(x) { return variations[2]( affine(x, 1/2, 1/5, 0, Math.sqrt(2), 1/2, 2) );},
        function(x) { return variations[1]( affine(x, 1/3, 0, 3, 0, 1/3, 3) );},
        function(x) { return variations[2]( affine(x, 1, 0, 0, 0, 1, 0) );},
    ];
    var fnColors = [1,1,0.8,0.3,0.1,0.1];
    // functions should also have a weight.

    var img = ctx.getImageData(0,0,w,h);
    var hist = new Int32Array(w*h*4);
    var data = img.data;

    var p = [rand(space.x_min, space.x_max), rand(space.y_min, space.y_max)];
    var c = rand(0,1);

    var iterations = 1e6;
    for(var n = 0; n<iterations; n++) {
        fnNo = floor(rand(0, fns.length));

        p = fns[fnNo](p);
        c = (c + fnColors[fnNo]) / 2;

        // no final or post transforms yet.

        // 20 because the paper says so.
        if (n>20) {
            var index = pixToIndex(coToPix(p));
            var color = palette(c);
            addToHist(hist, index, color);
        }
    }
    
    var gamma = 3;
    
    for (var i = 0; i < hist.length; i += 4) {
        var alpha = hist[i+3] || 1 ;
        var factor = Math.log(alpha) / alpha;

        data[i] = hist[i] * factor;
        data[i+1] = hist[i+1] * factor;
        data[i+2] = hist[i+2] * factor;
        data[i+3] = 255;

    }

    // The image will be plotted point-by-point in the loop for complex flames.
    ctx.putImageData(img,0,0);
}

/* ------------------------------------------------------------------------- */
// Variations

function r2(p) { return  pow(x(p), 2) + pow(y(p), 2); }
function r(p) { return Math.sqrt(r2(p)); };
function theta(p) { return Math.atan( x(p) / y(p) ); }
function phi(p) { return Math.atan( y(p) / x(p) ); };

var variations = {
    0: function(p) {return p;},  // linear
    1: function(p) {return [ Math.sin( x(p) ), Math.sin(y(p)) ];}, // sinusiodial
    2: function(p) {var s = 1/r2(p); return [ x(p)*s , y(p)*s ];}, // spherical
  };


/* A function is:
 * p = affine(p,abcdef)
 * p = v1*var1(p) + ... + vN*varN(p)
 * p = post(p);
 * A function has linear combination of one or more variations.
 */

// Plot it!
// The image should be plotted point-by-point in the loop for complex flames.
// But it make dev faster to have it continuously re-render.
window.setInterval(drawIFS, 1000, ctx);
