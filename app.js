


//
// particle!
// 
function Part(x, y, z, size) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.size = size==undefined?1: size,
  this.color = 'rgba(255, 255, 255, 0.9)'
}

// particle factory :)
function part(x, y, z, size) {
  return new Part(x, y, z, size);
}

// 
// math utils
//

function rotx(v, ang) {
    var c = Math.cos(ang)
    var s = Math.sin(ang)
    var y = v.y*c - v.z*s;
    var z = v.z*c + v.y*s;
    v.y = y;
    v.z = z;
}

function rotz(v, ang) {
    var c = Math.cos(ang)
    var s = Math.sin(ang)
    var x = v.x*c - v.y*s;
    var y = v.y*c + v.x*s;
    v.x = x;
    v.y = y;
}

function roty(v, ang) {
    var c = Math.cos(ang)
    var s = Math.sin(ang)
    var x = v.x*c + v.z*s;
    var z = v.z*c - v.x*s;
    v.x = x;
    v.z = z;
}

var w = 960,
    h = 500,
    z = d3.scale.category20c(),
    i = 0;

var w2 = w/2;
var h2 = h/2;

var svg = d3.select("#container").append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .style("pointer-events", "all")
    //.on("mousemove", particle);
    .on("mousedown", particle);

d3.select("#container").append("h1")
    .style('position', 'absolute')
    .style('top', '230px')
    .style('left', '450px')
    .text('loading');

// set a layer on top to post processing effect
var cover = document.createElement('div');
cover.setAttribute('class', 'cover');
document.getElementById("container").appendChild(cover);

// offscreen canvas to render text and images
var canvas = document.createElement('canvas');

if(location.href.indexOf('debug') < 0 ) {
    canvas.style['display'] = 'none';
}

var NPART = 100;
var time = 0;
var viz_logo = new Image();
viz_logo.src = "logo.png";

var world= new Image();
world.src = "mundo.png";

function ParticleSystem() {

  var particles = [];
  var target = [];


  this.particles = particles;
  this.target = target;

  function morph_to(t) {
    if(t.length >= particles.length) {
      var d = t.length - particles.length;
      for(var i = 0; i < d; ++i) {
        var ang = randf()*2*Math.PI;
        particles.push(part(500*Math.cos(ang), 500*Math.sin(ang), 0 ));
      }
    } else {
      particles = particles.slice(0, t.length);
    }
    target = t;
  }

  function append_morph(t) {
    for(var i= 0, l=t.length; i < l; i++) {
      target.push(t[i]);
    }
    morph_to(target);
  }

  this.custom_update = function(p) { return p };
  function update(time) {
    var custom_update = this.custom_update;
    for(var i = 0; i < particles.length; ++i) {
      var p = particles[i];
      var tp = target[i];
      tp = target[i] = custom_update(tp, time);
      p.x += (tp.x + Math.cos(time+i) - p.x)*0.2;
      p.y += (tp.y + Math.sin(time+i)- p.y)*0.2;
      p.z += (tp.z - p.z)*0.1;
      p.size += (tp.size - p.size)*0.1;
      
    }
  }

  function morph_to_image(img, x, y, map, scale) {
    scale = scale === undefined? 5:scale
    var px = get_pixels_for(function(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.drawImage(img, x, y);
    });
    var new_target = [];
    for(var i = 0; i < px.length; ++i) {
      var p = px[i];
      if(map) {
        p = map(p);
      }
      new_target[i] = part(scale*p.x, scale*p.y, scale*p.z)
    }
    morph_to(new_target);
  }

  function morph_to_text(text, x, y, append) {
    var px = get_pixels_for(function(ctx) {
        ctx.fillStyle = '#FFF';
        //#ctx.fillRect(0,0, 20, 20);
        ctx.font = '20px sans-serif';
        ctx.fillText(text, x, y);
    });
    var new_target = [];
    for(var i = 0; i < px.length; ++i) {
      var p = px[i];
      new_target[i] = part(5*p.x + 2*randf(), 5*p.y + 2*randf(), 0)
    }
    if (append) {
      append_morph(new_target);
    } else {
      morph_to(new_target);
    }
  }
  var color = '#0099CC';

  // if you change style for every particle
  // the demo _drags_
  function chage_color(svg, c) {
    svg.selectAll('circle').
      data(particles)
      .style("fill", function() {
        return c;
      })
    color = c;
  }

  function render(svg, bass) {
    svg.selectAll('circle').
      data(particles)
      .enter()
        .append("svg:circle")
          .attr('r', 1)
          .attr('cx', 0)//function(p) {0;return w2+p.x})
          .attr('cy', 0)//function(p){ return h2+p.y})
          .style("fill", color)
          .style("fill-opacity", 0.9)

    svg.selectAll('circle').
      data(particles)
      .exit()
          .remove()

    svg.selectAll('circle').
      data(particles)
      .attr("transform", function(p) {
        var x = w2 + 100*p.x/(100 + p.z)
        var y = h2 + 100*p.y/(100 + p.z)
        var s = Math.max(0, p.size*(3*bass + 100/(130 + p.z)));
        return "translate(" + x + "," + y + ") scale(" + s+") ";
      })
      /*.style("fill", function(p) {
        return p.color;
      })*/
  }

  this.update = update;
  this.morph_to_text = morph_to_text;
  this.morph_to_image = morph_to_image;
  this.render = render;
  this.morph_to = morph_to;
  this.chage_color = chage_color;
  return this;
}

var pixeltoLatLon = function (point) {
    var me = this;
    var origin = me.pixelOrigin_;
    var lng = 2*Math.PI*(point.x - 50)/100;
    var latRadians = Math.PI*(50 + point.y - 23)/46.0;
    //console.log(point.y, latRadians);
    /*var lat = (2*Math.atan(Math.exp(latRadians)) -
        Math.PI / 2);*/
    var lat = latRadians;
    return {lat: lat, lng: lng}
}

function get_pixels_for(f) {
  var CSIZE = 100;
  var CSIZE2 = CSIZE/2;
  var pixels = [];
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  canvas.width = CSIZE;
  canvas.height = CSIZE;
  
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CSIZE, CSIZE);
  f(ctx);
  var px = ctx.getImageData(0, 0, CSIZE, CSIZE).data;
  for(var i=0; i < CSIZE*CSIZE*4; i+=4) {
    if(px[i] > 0) {
      var jj = i/4;
      pixels.push(part(jj%CSIZE - CSIZE2, ((jj/CSIZE)>>0) - CSIZE2, 0))
    }
  }
  return pixels;
}

function SceneManager(scenes) {
  var curr = null;
  this.scenes = scenes;
  var scene = scenes[0];
  this.update = function(time, bass) {
    var i = 0;
    for(; i < scenes.length && scenes[i].time < time; ++i) {
    }
    scene = scenes[i-1]
      if((scene.force || bass > 0.2) && (curr === null || curr.time != scene.time)) {
        console.log(bass);
        console.log("scene " + i);
        scene.go();
        curr = scene;
    }
  }
}

var spiral = function(){
    textPart.custom_update = function(p, time) {
          rotz(p, 0.05);
          p.z -= 10;
          return p;

    }
    var particles = [];
    for(var i = 0; i < 200 ; ++i) {
      var phase = 31*2*Math.PI*i/NPART;
      //particles[i] = part(400*randf(), 400*randf(), 0) ;
      var R = 300;
      particles[i] = part(R*Math.cos(phase), R*Math.sin(phase),15*i);
      particles[i].size = 3;//((40+R)/315)*(3+ 5*Math.random())
    }
    textPart.morph_to(particles);
}

var orbit = function(){
    textPart.custom_update = function(p, time) {
          var d = Math.sqrt(p.x*p.x + p.y*p.y)
          var vel = Math.max(10, (200 - d))
          vel*=vel;
          rotz(p, vel*0.000001);
          return p;
    }
    var particles = [];
    for(var i = 0; i < 100 ; ++i) {
      var phase = 2*Math.PI*i/NPART;
      //particles[i] = part(400*randf(), 400*randf(), 0) ;
      var R = 15 + 300*randf();
      particles[i] = part(R*Math.cos(phase), R*Math.sin(phase),0);
      particles[i].size = ((40+R)/315)*(3+ 5*Math.random())
    }
    textPart.morph_to(particles);
}
var collapse = function() { 
    textPart.custom_update = function(p, time) {
        p.x *= 1.005;
        p.y *=0.99;
        var d = Math.abs(p.x + p.y);
        if(d > 130) d = 130;
        p.size *= (0.999 + 0.008*(130 -d)/130)
        return p;
    }
    var particles = [];
    for(var i = 0; i < 100 ; ++i) {
      var phase = 2*Math.PI*i/NPART;
      particles[i] = part(400*randf(), 400*randf(), 0) ;
      particles[i].size = 10+ 20*Math.random()
    }
    textPart.morph_to(particles);
}

function reset() {
  textPart.custom_update = function(p, time) { return p; }
}

var BASE = 39000;
scenemanager = new SceneManager([
    {time: 0, go: function() { } },
    {time: 10, force: true, go: collapse },
    {time: 7797, go: function() { 
    textPart.custom_update = function(p, time) { return p}
    textPart.morph_to_text('HELLO!', 20, 30); } },
    {time: 11145, go: function() { textPart.morph_to_text('we are', 20, 40); } },
    {time: 14500, go: function() { 
          textPart.morph_to_image(viz_logo, 10, 15);
          textPart.chage_color(svg, '#669933');
      }
    },
    {time: 19500, go: function() { 
        textPart.morph_to_text(' we', 30, 25);
        textPart.chage_color(svg, '#0099CC');
      }
    },
    {time: 20000, go: function() { 
        textPart.morph_to_text(' ♥ ', 32, 55, true);
      }
    },
    {time: 20500, go: function() { 
        textPart.morph_to_text('maps', 25, 85, true);
      }
    },
    {time: 23436, go: function() { 
        textPart.morph_to_image(world, 0, 20, null, 5);
      }
    },
    {time: 26436, go: function() { 
        textPart.custom_update = function(p, time) {
              roty(p, time*0.000001);
              return p;
        }
        textPart.morph_to_image(world, 0, 0, function(p) {
          var polar = pixeltoLatLon(p);
          var R = 60;
          var r = R*Math.cos(-polar.lat);
          var p = part(r*Math.sin(polar.lng), r*Math.cos(polar.lng), R*Math.sin(-polar.lat));
          rotx(p, Math.PI/2);
          return p;
        }, 1);
      }
    },
    {time: 31000, go: function() { 
        textPart.custom_update = function(p, time) {
              return p;
        }
        textPart.morph_to_text('we ♥ data', 0, 55);
      }
    },
    {time: 34500, go: orbit},
    {time: BASE,force: true, go: function() { reset(); textPart.morph_to_text('this', 0, 15); }},
    {time: BASE + 300, force: true,go: function() { textPart.morph_to_text('is', 0, 35, true); }},
    {time: BASE + 600, force: true,go: function() { textPart.morph_to_text('our', 0, 55, true); }},
    {time: BASE + 900, force: true, go: function() { textPart.morph_to_text('proposal', 0, 75, true); }},
    {time: BASE + 1200, force: true, go: function() { textPart.morph_to_text('for', 0, 95, true); }},
    {time: BASE + 1500, force: true,go: function() { textPart.morph_to_text('xx was', 0, 35, true); }},
    {time: BASE + 5200, force: true,go: function() { textPart.morph_to_text('SPAINJS', 10, 55 ); }},
    {time: BASE + 7000, force: true,go: function() { textPart.morph_to_text('D3 ♥ JS', 10, 55 ); }},
    {time: BASE + 11000, go: spiral},
    {time: BASE + 19500, go: function() {
        reset();
        var particles = [];
        particles.push(part(-300, 100, 0, 20))
        particles.push(part(-300, 100, 0, 10))
        particles.push(part(-300, 50, 0, 5))
        particles.push(part(-300, 50, 0, 3))

        particles.push(part(300, 100, 0, 20))
        particles.push(part(300, 100, 0, 10))
        particles.push(part(300, 50, 0, 5))
        particles.push(part(300, 50, 0, 3))

        textPart.morph_to(particles);
        textPart.morph_to_text('see you in', 2, 40, true);
        textPart.morph_to_text('#spainjs', 12, 65, true);
      }
    },
    /*{time: 38500, go: function() {
        textPart.morph_to_text('music: ', 0, 50, true);
    }
    }*/
]);


function init_() {
  for(var i = 0; i < NPART; ++i) {
    var phase = 2*Math.PI*i/NPART;
    particles[i] = part(100*Math.cos(phase), 100*Math.sin(phase),0);
  }
}


var textPart = new ParticleSystem();
var audio = new AudioKeys('music.ogg');

function init() {

  audio.load(function() {
    d3.select("#container").select("h1").remove();
    audio.play();
    audio.addWatchers(0, 10, 180, 255);
    init_render();
  });
}

function init_render() {
  start = new Date().getTime();
  setInterval(function() {
      time = (new Date().getTime() - start);
      audio.process();
      textPart.update(time);
      bass = audio.getLevels(0);
      textPart.render(svg, bass);
      scenemanager.update(time, bass);
  }, 20);
}

function randf() { 
  return 0.5*(Math.random()*2 - 1)
}
function rand_step() {
  return randf() < 0 ? 1: -1;
}

init();
window.onkeypress = function(e) {
  console.log("time " + (time))
}


function particle() {
  morph_to_text('javi', 10, 20);
}

