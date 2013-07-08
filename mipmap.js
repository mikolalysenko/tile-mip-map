"use strict"

var ndarray = require("ndarray")
var ops = require("ndarray-ops")
var unpack = require("ndarray-unpack")
var downsample = require("ndarray-downsample2x")

function makeTileMipMap(tilearray, pad) {
  pad = pad || 1

  var levels = []
  
  var s = tilearray.shape
  var nx = s[0]
  var ny = s[1]
  var hx = s[2]
  var hy = s[3]
  var channels = s[4]
  var ctor = tilearray.data.constructor
  
  var tx = hx * pad
  var ty = hy * pad
  
  while(tx > 0 && ty > 0) {
    var sz     = nx * ny * tx * ty * channels
    var shape  = [nx, ny, tx, ty, channels]
    var stride = [channels*ny*tx*ty, channels*ty, channels*ny*ty, channels, 1]
    var level  = ndarray(new ctor(sz), shape, stride, 0)
    
    if(levels.length === 0) {
      for(var i=0; i<nx; ++i) {
        for(var j=0; j<ny; ++j) {
          for(var k=0; k<channels; ++k) {
            var t0 = level.pick(i,j,undefined,undefined,k)
            var t1 = tilearray.pick(i,j,undefined,undefined,k)
            for(var x=0; x<pad; ++x) {
              for(var y=0; y<pad; ++y) {
                ops.assign(t0.lo(hx*x, hy*y).hi(hx,hy), t1)
              }
            }
          }
        }
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