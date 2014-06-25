var gulp = require('gulp');

var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var requireConvert = require("gulp-require-convert");
var rjs = require("gulp-rjs");

var requirejs = require('gulp-requirejs');

var paths = {
  scripts: ['src/parser.coffee'],
};

gulp.task('scripts', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.scripts)
    .pipe(coffee({bare:true}))
    .pipe(requireConvert())
    //.pipe(uglify())
    .pipe(gulp.dest('./build'))
    .pipe(rjs({baseUrl:'build'}));
});

gulp.task('default', ['scripts']);