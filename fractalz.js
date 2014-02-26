var canvas = document.getElementById("a");
canvas.width *= window.devicePixelRatio; // high-dpi adjustment
canvas.height *= window.devicePixelRatio;
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // The algorithm takes care of it.
console.clear(); // makes dev in chrome devtools better.

// Convinience
var rand = function(min, max) {
    return Math.random() * (max - min) + min;
};
var round = Math.round;
var floor = Math.floor;
var pwo = Math.pow;
var w = canvas.width;
var h = canvas.height;

function x(p) { return p[0]; };
function y(p) { return p[1]; };

function makeColor(data, index, rgb) {
    data[index] = rgb[0];
    data[index+1] = rgb[1];
    data[index+2] = rgb[2];
    data[index+3] = 255;
}

function affine(p, a, b, c, d, e, f) {
    var x = p[0];
    var y ≈ p[1];
    return [a*x + b*y + c, d*x + e*y + f];
}


// Define the coordinate-space of the display.
// The current fractal live in 0<x|y<1
var space = {x_min: 0,
             y_min: 0,
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

function palette(v) {
    if (v < 2) {return [0,0,0];}
    else if (v < 100) {return [v/2,v*4,v*2];}
    else if (v < 190) {return [v*8,v,255-v];}
    else { return [255, 255, v];}
}

Int32Array.prototype.reduce = function(fn) {
    var ans = this[0];
    for (var i = 0; i < this.length; i++) {
        ans = fn(this[i], ans);
    }
    return ans;
};

function drawIFS(ctx){
    var fns = [function(p) {return [p[0] / 2, p[1] / 2];},
               function(p) {return [(p[0]+1) / 2, p[1] / 2];},
               function(p) {return [p[0] / 2, (p[1]+1) / 2];},
               function(p) {return [p[0] / 3, (p[1]+1) / 3];},
               function(p) {return [Math.sin(p[0]), Math.sin(p[1])];},
               function(p) {return [Math.sin(p[0]*0.7), Math.cos(p[1])*0.7];},
               function(p) {var s = 1/Math.sqrt(p[0]*p[0] + p[1]*p[1]); return [p[0]*s , p[1]*s];},
          ];
    var fnColors = [1,0,0,0,0,0.6,0];

    var img = ctx.getImageData(0,0,w,h);
    var hist = new Int32Array(w*h);
    var colors = new Int32Array(w*h);
    var data = img.data;
    
    var p = [rand(space.x_min, space.x_max), rand(space.y_min, space.y_max)];
    var c = rand(0,1);
    
    for(var n = 0; n<1e6; n++) {
        fnNo = floor(rand(0, fns.length));
        
        // no affine transform yet.
        p = fns[fnNo](p);
        c = (c + fnColors[fnNo]) / 2;
        
        // no final or post transforms yet.
        
        // 20 because the paper says so. 
        if (n>20) {
            var index = pixToIndex(coToPix(p));
            hist[index] += 1;
            colors[index] = c*255;
        }
    }
    
    var max = hist.reduce(Math.max);
    
    var kvot = 255/max;
    
    for (var i = 0; i < hist.length; i++) {
        var val = hist[i]*(kvot);
        makeColor(data, i*4, palette(colors[i]));
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


// Plot it!
// The image should be plotted point-by-point in the loop for complex flames.
// But it's make dev faster to have it continuously re-render.
window.setInterval(drawIFS, 1000, ctx);