"use strict"

var ndarray = require("ndarray")
var downsample = require("ndarray-downsample2x")

function makeTileMipMap(tilearray) {
  var levels = [tilearray]
  
  var s = tilearray.shape
  var nx = s[0]
  var ny = s[1]
  var tx = s[2]>>1
  var ty = s[3]>>1
  var channels = s[4]
  var ctor = tilearray.data.constructor
  
  while(tx > 0 && ty > 0) {
    var sz     = nx * ny * tx * ty * channels
    var level  = ndarray(new ctor(sz),
              [nx, ny, tx, ty, channels],
              [channels*ny*tx*ty, channels*ty, channels*ny*ty, channels, 1],
              0)
    var plevel = levels[levels.length-1]
    
    for(var i=0; i<nx; ++i) {
      for(var j=0; j<ny; ++j) {
        for(var k=0; k<channels; ++k) {
          var t0 = level.pick(i,j,undefined,undefined,k)
          var t1 = plevel.pick(i,j,undefined,undefined,k)
          console.log(t0.shape, t1.shape, t0.offset, t1.offset, t0.stride, t1.stride)
          downsample(t0, t1)
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