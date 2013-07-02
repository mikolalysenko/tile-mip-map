"use strict"

var fs = require("fs")
var ndarray = require("ndarray")
var savePixels = require("save-pixels")

require("get-pixels")("./painterly.png", function(err, image) {

  //Cut 256x256x4 array into 16x16 tiles of width 16x16x4
  var tilemap = ndarray(image.data,
    [16, 16, 16, 16, 4],
    [16*16*16*4, 16*4, 16*16*4, 4, 1],
    0)
    
  //Compute mip pyramid
  var mipmap = require("../mipmap.js")(tilemap)

  //Save levels to images
  for(var i=0; i<mipmap.length; ++i) {
    var s = mipmap[i].shape
    var x = ndarray(mipmap[i].data, [s[0]*s[2], s[1]*s[3], s[4]])
    savePixels(x, "png").pipe(fs.createWriteStream(i + ".png"))
  }
})
