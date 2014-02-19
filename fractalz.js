
var canvas = document.getElementById("a");
canvas.width *= window.devicePixelRatio;
canvas.height *= window.devicePixelRatio;
var c = canvas.getContext("2d");
c.imageSmoothingEnabled = false;
console.clear();

var rand = function(min, max) {
    return Math.random() * (max - min) + min;
};
var round = Math.round;
var floor = Math.floor;

var w = canvas.width;
var h = canvas.height;

var space = {x_min: 0,
             y_min: 0,
             x_max: 1,
             y_max: 1
            };

function coToPix(p) {
           var x_len = (space.x_max - space.x_min);
           var y_len = (space.x_max - space.x_min);

           return [round((p[0] - space.x_min)*w / x_len), 
                   round(h - (p[1] - space.y_min)*h / y_len)];
}

function makeColor(data, index, rgb) {
    data[index] = rgb[0];
    data[index+1] = rgb[1];
    data[index+2] = rgb[2];
    data[index+3] = 255;
}

function pixToIndex(p) {
    return (p[1] * w + p[0]);
}

function palette(v) {
    if (v < 2) {return [0,0,0];}
    else if (v < 100) {return [v/2,v*4,v*2];}
    else if (v < 140) {return [v*8,v,255-v];}
    else { return [255, 255, v];}
}

function drawIFS(c){
    var fns = [//function(p) {return [p[0] / 2, p[1] / 2];},
               function(p) {return [(p[0]+1) / 2, p[1] / 2];},
               //function(p) {return [p[0] / 2, (p[1]+1) / 2];},
               function(p) {return [p[0] / 3, (p[1]+1) / 3];},
               function(p) {return [Math.sin(p[0]), Math.sin(p[1])];},
               function(p) {return [Math.sin(p[0]*0.7), Math.cos(p[1])*0.7];},
               //function(p) {return [p[0]/2 , Math.log(p[1])/3];},
          ];

    var img = c.getImageData(0,0,w,h);
    var hist = new Int32Array(w*h);
    var data = img.data;
    
    var p = [rand(space.x_min, space.x_max), rand(space.y_min, space.y_max)];
    
    for(var n = 0; n<1e6; n++) {
        fnNo = floor(rand(0, fns.length));
        
        p = fns[fnNo](p);
        // 20 because the paper says so. 
        if (n>20) {
            hist[pixToIndex(coToPix(p))] += 1;
        }
    }
    
    var max = 0;
    for (var i = 0; i < hist.length; i++) {
        hist[i] = Math.log(hist[i]);
        max = (hist[i] > max) ? hist[i] : max;
    }
    
    var kvot = 255/max;
    
    for (var i = 0; i < hist.length; i++) {
        var val = hist[i]*(kvot);
        makeColor(data, i*4, palette(val));
    }
        
    c.putImageData(img,0,0);
}

window.setInterval(drawIFS, 1000, c);
