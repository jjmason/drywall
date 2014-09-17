#!/usr/bin/env node

function build ( ) {
  var grunt = require('grunt');
  // grunt.loadNpmTasks('grunt-contrib-copy');
  // grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-contrib-less');
  // grunt.loadNpmTasks('grunt-newer');
  var path = require('path');
  var bower = require('bower');
  console.log("DIR", __dirname);
  var orig_dir = process.cwd( );
  process.cwd(__dirname);
  bower.commands.install( )
  .on('end', function (installed) {
    process.cwd(orig_dir);
    var file = path.resolve(__dirname, 'Gruntfile');
    grunt.file.setBase(path.resolve(__dirname));
    var config = require(file)
    config(grunt);
    console.log('grunt running');
    grunt.tasks(['build']);
    console.log('grunt finished');
  });

}

if (!module.parent) {
  build( );
}
