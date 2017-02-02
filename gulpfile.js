var gulp = require('gulp');

var jslint = require('gulp-jslint');

gulp.task('jslint', function(){
	return gulp.src(['bolt.js', 'sys/**/*.js'])
		.pipe(jslint())
		.pipe(jslint.reporter('stylish'))
});

gulp.task('test', ['jslint'], function(){
});