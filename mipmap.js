"use strict"

var ndarray = require("ndarray")
var ops = require("ndarray-ops")
var downsample = require("ndarray-downsample2x")

function applyPad(out, inp) {
  var tx = inp.shape[0]
  var ty = inp.shape[1]
  var hx = tx>>>1
  var hy = ty>>>1
  var ox = tx*2
  var oy = ty*2
  
  //Copy corners
  ops.assign(out.lo(    0,    0).hi(hx,hy), inp.lo(hx,hy).hi(hx,hy))
  ops.assign(out.lo(ox-hx,    0).hi(hx,hy), inp.lo( 0,hy).hi(hx,hy))
  ops.assign(out.lo(ox-hx,oy-hy).hi(hx,hy), inp.lo( 0, 0).hi(hx,hy))
  ops.assign(out.lo(    0,oy-hy).hi(hx,hy), inp.lo(hx, 0).hi(hx,hy))
  
  //Copy sides
  ops.assign(out.lo(   hx,    0).hi(tx,hy), inp.lo( 0,hy).hi(tx,hy))
  ops.assign(out.lo(   hx,oy-hy).hi(tx,hy), inp.lo( 0, 0).hi(tx,hy))
  ops.assign(out.lo(    0,   hy).hi(hx,ty), inp.lo(hx, 0).hi(hx,ty))
  ops.assign(out.lo(ox-hx,   hy).hi(hx,ty), inp.lo( 0, 0).hi(hx,ty))
  
  //Copy center
  ops.assign(out.lo(hx,hy).hi(tx,ty), inp)
}

function makeTileMipMap(tilearray, pad) {
  pad = !!pad

  var levels = []
  
  var s = tilearray.shape
  var nx = s[0]
  var ny = s[1]
  var tx = s[2]
  var ty = s[3]
  var channels = s[4]
  var ctor = tilearray.data.constructor
  
  if(pad) {
    tx = tx * 2
    ty = ty * 2
  }
  
  while(tx > 0 && ty > 0) {
    var sz     = nx * ny * tx * ty * channels
    var shape  = [nx, ny, tx, ty, channels]
    var stride = [channels*ny*tx*ty, channels*ty, channels*ny*ty, channels, 1]
    var level  = ndarray(new ctor(sz), shape, stride, 0)
    
    if(levels.length === 0) {
      if(pad) {
        for(var i=0; i<nx; ++i) {
          for(var j=0; j<ny; ++j) {
            for(var k=0; k<channels; ++k) {
              var t0 = level.pick(i,j,undefined,undefined,k)
              var t1 = tilearray.pick(i,j,undefined,undefined,k)
              applyPad(t0, t1, 0, 255)
            }
          }
        }
      } else {
        ops.assign(level, tilearray)
      }
    } else {
      var plevel = levels[levels.length-1]
      for(var i=0; i<nx; ++i) {
        for(var j=0; j<ny; ++j) {
          for(var k=0; k<channels; ++k) {
            var t0 = level.pick(i,j,undefined,undefined,k)
            var t1 = plevel.pick(i,j,undefined,undefined,k)
            downsample(t0, t1, 0, 255)
          }
        }
      }
    }
    
    levels.push(level)
    
    tx>>>=1
    ty>>>=1
  }

  return levels
}
module.exports = makeTileMipMap