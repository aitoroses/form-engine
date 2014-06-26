var gulp = require('gulp');

var coffee = require('gulp-coffee');
var uglify = require('gulp-uglify');
var requireConvert = require("gulp-require-convert");

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
});

gulp.task('default', ['scripts']);