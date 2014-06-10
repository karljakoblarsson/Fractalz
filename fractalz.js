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
 * Combinations of NLFns.
 * Multiple weighted flames
 * Multistage computation and display.
 * More variations
 * Flame loading
 */

/* ----- 2D Setup ----- */
var canvas = document.getElementById("a");
canvas.width *= window.devicePixelRatio; // high-dpi adjustment
canvas.height *= window.devicePixelRatio;
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // The algorithm takes care of it.
var w = canvas.width;
var h = canvas.height;


// Transform from coordinate-space to screen-space.
function coToPix(p, space) {
    var x_len = (space.x_max - space.x_min);
    var y_len = (space.x_max - space.x_min);

    return [round((p[0] - space.x_min)*w / x_len), 
            round(h - (p[1] - space.y_min)*h / y_len)];
}

function pixToIndex(p) {
    return (p[1] * w + p[0]);
}

/***** *****/
function makeColor(data, index, rgba) {
    data[index] = rgba[0];
    data[index+1] = rgba[1];
    data[index+2] = rgba[2];
    data[index+3] = rgba[4] || 1;
}

// Using the histogram as a parameter makes the fn 3x slower???
// The most expensive function in the code. Why?
function addToHist(index, rgba) {
    index *= 4;
    hist[index] += rgba[0];
    hist[index+1] += rgba[1];
    hist[index+2] += rgba[2];
    hist[index+3] += rgba[4] || 1;
}


// Define the coordinate-space of the display.
var space = {x_min: -1, y_min: -1,
             x_max: 1,  y_max: 1
            };
            
// I desperatly need a new datastruct for the xforms.
var fns = [
    function(x) { return variations[0]( affine(x, 1/2, 0, 0, 0, 1/2, 0) );},
    function(x) { return variations[1]( affine(x, 1/2, 0, 2, 0, 1/2, 0) );},
    function(x) { return variations[2]( affine(x, 1/2, 1/5, 0, Math.sqrt(2), 1/2, 2) );},
    function(x) { return variations[1]( affine(x, 1/3, 0, 3, 0, 1/3, 3) );},
    function(x) { return variations[2]( affine(x, 1, 0, 0, 0, 1, 0) );},
];
var fnColors = [1,1,0.8,0.3,0.1,0.1];
// functions should also have a weight.

var palette = palette1;


var img = ctx.createImageData(w,h);
var hist = new Int32Array(w*h*4);
var data = img.data;


function logDisplay() {
    img = ctx.createImageData(w,h);
    for (var i = 0; i < hist.length; i += 4) {
        var alpha = hist[i+3] || 1 ;
        var factor = Math.log(alpha) / alpha;

        img.data[i] = hist[i] * factor;
        img.data[i+1] = hist[i+1] * factor;
        img.data[i+2] = hist[i+2] * factor;
        img.data[i+3] = 255;

    }
}

ctx.fillStyle = "#FFF";

function drawIFS(ctx){
    console.log("hej");
    ctx.clearRect(0,0,w,h);
    hist = new Int32Array(w*h*4);
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
            var index = pixToIndex(coToPix(p, space));
            var color = palette(c);
            addToHist(index, color);
        }
        
        /*if (n%1e5 === 0) {
            ctx.clearRect(0,0,w,h);
            logDisplay();
            ctx.putImageData(img,0,0);
            console.log("Paint - partial");
        }*/
        
        if (n%1e5 === 0) {
            console.log(n/1e5);
        }
    }
    
    var gamma = 3;

    logDisplay();

    // The image will be plotted point-by-point in the loop for complex flames.
    //ctx.clearRect(0,0,w,h);
    ctx.putImageData(img,0,0);
    
}

/* ------------------- Variations ------------------------ */

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

/* ---- Plot it! ----- */
// The image should be plotted point-by-point in the loop for complex flames.
// But it make dev faster to have it continuously re-render.
//window.setInterval(drawIFS, 5000, ctx);
drawIFS(ctx);