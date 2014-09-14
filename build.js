
function build ( ) {
  var grunt = require('grunt');
  process.cwd(__dirname);
  var config = require('./Gruntfile')
  config(grunt);
  var bower = require('bower');
  bower.commands.install( )
  .on('end', function (installed) {
    grunt.tasks(['build']);
  });

}

if (!module.parent) {
  build( );
}
