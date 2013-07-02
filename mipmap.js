"use strict"

var ndarray = require("ndarray")
var downsample = require("ndarray-downsample2x")

function createTileArray(nr, nc, tileH, tileW, channels) {
  var sz = nr * nc * tileX * tileY * channels
  return ndarray(new Float32Array(sz), [nr, nc, tileH, tileW, channels])
}

function makeTileMipMap(tilearray) {
  var levels = [tilearray]
  
  var nr = tilearray.shape[0]
  var nc = tilearray.shape[1]
  var tileH = tilearray.shape[2]>>1
  var tileW = tilearray.shape[3]>>1
  var channels = tilearray.shape[4]
  
  while(tileH > 0 && tileW > 0) {
    var mip_level = createTileArray(nr, nc, tileH, tileW, channels)
    for(var i=0; i<nr; ++i) {
      for(var j=0; j<nc; ++j) {
        for(var k=0; k<channels; ++k) {
          downsample(
            mip_level.pick(i,j,false,false,k),
            levels[levels.length-1].pick(i,j,false,false,k))
        }
      }
    }
    levels.push(mip_level)
    tileH>>=1
    tileW>>=1
  }

  return levels
}
module.exports = makeTileMipMap