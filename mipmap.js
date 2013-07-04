"use strict"

var ndarray = require("ndarray")
var ops = require("ndarray-ops")
var unpack = require("ndarray-unpack")
var downsample = require("ndarray-downsample2x")

function applyPad(out, inp) {
  var tx = inp.shape[0]
  var ty = inp.shape[1]

  var otile = ndarray(out.data,
      [2, 2, tx, ty],
      [tx*out.stride[0], ty*out.stride[1], out.stride[0], out.stride[1]],
      out.offset)
  
  var itile = ndarray(inp.data,
      [2, 2, tx, ty],
      [0, 0, inp.stride[0], inp.stride[1]],
      inp.offset)

  ops.assign(otile, itile)
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