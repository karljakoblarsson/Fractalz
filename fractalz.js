/* Fractal flame in javascript + canvas.
 * Karl Jakob Larsson 2014
 * MIT License
 */

/* TODO:
 * Refractor drawIFS() into smaller fns. To be able to profile.
 * Adjust colors
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
// For faster dev
canvas.width *= window.devicePixelRatio; // high-dpi adjustment
canvas.height *= window.devicePixelRatio;
//canvas.width *= 0.5;
//canvas.height *= 0.5;
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // The algorithm takes care of it.
var w = canvas.width;
var h = canvas.height;


// Transform from coordinate-space to screen-space.
function coToPix(p, space) {
    var x_len = (space.x_max - space.x_min);
    var y_len = (space.y_max - space.y_min);

    return [round((p[0] - space.x_min) * w / x_len), 
            round(h - (p[1] - space.y_min) * h / y_len)];
}

function pixToIndex(p) {
    return (p[1] * w + p[0]);
}

function insideSpace(p, space) {
    return ((p[0] >= space.x_min) && (p[0] <= space.x_max)) && ((p[1] >= space.y_min) && (p[1] <= space.y_max));
}


// Define the coordinate-space of the display.
var space = {x_min: -1, y_min: -1,
             x_max: 1,  y_max: 1
            };

// I desperatly need a new datastruct for the xforms.
var fns = [
    function(x) { return variations[0](affine(x, 1/2, 0, 0, 0, 1/2, 0));},
    function(x) { return variations[1](affine(x, 1/2, 0, 2, 0, 1/2, 0));},
    function(x) { return variations[2](affine(x, 1/2, 1/5, 0, Math.sqrt(2), 1/2, 2));},
    function(x) { return variations[1](affine(x, 1/3, 0, 3, 0, 1/3, 3));},
    function(x) { return variations[2](affine(x, 1, 0, 0, 0, 1, 0));},
];
var fnColors = [1,1,0.8,0.3,0.1,0.1];
// functions should also have a weight.

var palette = palette1;
//palette = function(c) {return [c*255, c*100, c*75]}

var hist = []; //new Int32Array(w*h*4);
for(var i = 0; i < w*h*4; i += 1){
    hist[i] = 0;
}

function logDisplay(histogram) {
    var img = ctx.createImageData(w,h);
    var max_alpha = 0;
    for (var i = 3; i < w*h*4 - 4; i += 4) {
        if (hist[i] > max_alpha) {
            max_alpha = hist[i];
        }
    }
    
    for (var i = 0; i < w*h*4 - 4; i += 4) {
        var alpha = hist[i+3] || 1 ;
        var factor = log(alpha) / log(max_alpha) / alpha * 3;

        img.data[i] = histogram[i] * factor;
        img.data[i+1] = histogram[i+1] * factor;
        img.data[i+2] = histogram[i+2] * factor;
        img.data[i+3] = 255;

    }
    return img;
}

function gammaAdjust(img, gamma, vib) {
    var applyGamma = function(v) {
        var exponent = 1 / gamma;
        return pow(v / 255, exponent) * 255;
    }
    for (var i = 0; i < w*h*4 - 4; i += 4) {
        img.data[i] = applyGamma(img.data[i]);
        img.data[i+1] = applyGamma(img.data[i+1]);
        img.data[i+2] = applyGamma(img.data[i+2]);
    }
    return img;
}

ctx.fillStyle = "#FFF";

function iterateIFS(histogram, iterations){
    function addToHist(index, rgba) {
        index *= 4;
        histogram[index] += rgba[0];
        histogram[index+1] += rgba[1];
        histogram[index+2] += rgba[2];
        histogram[index+3] += 1;
    }
    var p = [rand(space.x_min, space.x_max), rand(space.y_min, space.y_max)];
    var c = rand(0,1);

    for(var n = 0; n<iterations; n++) {
        fnNo = floor(rand(0, fns.length));

        p = fns[fnNo](p);
        c = (c + fnColors[fnNo]) / 2;

        // no final or post transforms yet.

        // 20 because the paper says so.
        if (n>20) {
            if (insideSpace(p,space)) {
                var index = pixToIndex(coToPix(p, space));
                var color = palette(c);
                addToHist(index, color);
            }
        }
    }

    return histogram;
}

var display = function(ctx, histogram) {
    var img = logDisplay(histogram);

    var gamma = 1.2;
    var vib = 1;
    img = gammaAdjust(img, gamma, vib);

    // The image will be plotted point-by-point in the loop for complex flames.
    ctx.clearRect(0,0,w,h);
    ctx.putImageData(img,0,0);
}

var drawIFS = function(ctx) {
    hist = iterateIFS(hist, 1e6);
    display(ctx, hist);
}




/* ------------------- Variations ------------------------ */

/* A function is:
 * p = affine(p,abcdef)
 * p = v1*var1(p) + ... + vN*varN(p)
 * p = post(p);
 * A function has linear combination of one or more variations.
 */

/* ---- Plot it! ----- */
drawIFS(ctx);



/* ---- Stuff ---- */
//
//for (var i = 0; i < w*h*4 - 4; i += 4){
//  var r = hist[i]; var g = hist[i+1]; var b = hist[i+2]; var a = hist[i+3];
//  var bright = bright || 0;
//  if (bright < Math.sqrt((r*r+g*g+b*b))) {
//    bright = Math.sqrt((r*r+g*g+b*b));
//    rmax = r; bmax = b; gmax = g; imax = i;
//}}
