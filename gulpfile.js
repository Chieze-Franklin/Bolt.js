var gulp = require('gulp');

var del = require('del');
var jslint = require('gulp-jslint');
var runSequence = require('run-sequence');

gulp.task('jslint', function(){
	return gulp.src(['bolt.js', 'sys/**/*.js'])
		.pipe(jslint())
		.pipe(jslint.reporter('stylish'))
});

gulp.task('test', ['jslint'], function(){
});

/*
	npm doesn't allow git repos in node_modules...
	there are different ways to solve this issue, including altering the source code of npm
	but I don't want to do that
	instead, I keep the "pure" npm modules in node_modules
	and use gulp watch-dev to sync those modules with their development counterparts in node_modules-dev
*/
//TODO: clean the destination folder except .git folder

gulp.task('copy:bolt-internal-checks', function(){
	return gulp.src(['node_modules/bolt-internal-checks/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-checks'))
});
gulp.task('copy:bolt-internal-config', function(){
	return gulp.src(['node_modules/bolt-internal-config/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-config'))
});
gulp.task('copy:bolt-internal-defs', function(){
	return gulp.src(['node_modules/bolt-internal-defs/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-defs'))
});
gulp.task('copy:bolt-internal-errors', function(){
	return gulp.src(['node_modules/bolt-internal-errors/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-errors'))
});
gulp.task('copy:bolt-internal-get-routes', function(){
	return gulp.src(['node_modules/bolt-internal-get-routes/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-get-routes'))
});
gulp.task('copy:bolt-internal-models', function(){
	return gulp.src(['node_modules/bolt-internal-models/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-models'))
});
gulp.task('copy:bolt-internal-schemata', function(){
	return gulp.src(['node_modules/bolt-internal-schemata/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-schemata'))
});
gulp.task('copy:bolt-internal-setup', function(){
	return gulp.src(['node_modules/bolt-internal-setup/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-setup'))
});
gulp.task('copy:bolt-internal-utils', function(){
	return gulp.src(['node_modules/bolt-internal-utils/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-utils'))
});
gulp.task('copy:bolt-module-db', function(){
	return gulp.src(['node_modules/bolt-module-db/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-db'))
});
gulp.task('copy:bolt-module-events', function(){
	return gulp.src(['node_modules/bolt-module-events/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-events'))
});
gulp.task('copy:bolt-module-system', function(){
	return gulp.src(['node_modules/bolt-module-system/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-system'))
});
gulp.task('copy:bolt-settings', function(){
	return gulp.src(['node_modules/bolt-settings/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-settings'))
});
gulp.task('copy:bolt-ui-pages', function(){
	return gulp.src(['node_modules/bolt-ui-pages/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-ui-pages'))
});
gulp.task('copy:bolt-ui-sweetalert', function(){
	return gulp.src(['node_modules/bolt-ui-sweetalert/**/*'])
		.pipe(gulp.dest('node_modules-dev/bolt-ui-sweetalert'))
});
gulp.task('copy:ctl-sms-home', function(){
	return gulp.src(['node_modules/ctl-sms-home/**/*'])
		.pipe(gulp.dest('node_modules-dev/ctl-sms-home'))
});
gulp.task('copy:ctl-sms-students', function(){
	return gulp.src(['node_modules/ctl-sms-students/**/*'])
		.pipe(gulp.dest('node_modules-dev/ctl-sms-students'))
});

gulp.task('del:bolt-internal-checks', function(){
	return del(['node_modules-dev/bolt-internal-checks/**/*', '!node_modules-dev/bolt-internal-checks/.git'])
});

gulp.task('watch-dev', function(){
	gulp.watch('node_modules/bolt-internal-checks/**/*', ['del:bolt-internal-checks', 'copy:bolt-internal-checks']);
	gulp.watch('node_modules/bolt-internal-config/**/*', ['copy:bolt-internal-config']);
	gulp.watch('node_modules/bolt-internal-defs/**/*', ['copy:bolt-internal-defs']);
	gulp.watch('node_modules/bolt-internal-errors/**/*', ['copy:bolt-internal-errors']);
	gulp.watch('node_modules/bolt-internal-get-routes/**/*', ['copy:bolt-internal-get-routes']);
	gulp.watch('node_modules/bolt-internal-models/**/*', ['copy:bolt-internal-models']);
	gulp.watch('node_modules/bolt-internal-schemata/**/*', ['copy:bolt-internal-schemata']);
	gulp.watch('node_modules/bolt-internal-setup/**/*', ['copy:bolt-internal-setup']);
	gulp.watch('node_modules/bolt-internal-utils/**/*', ['copy:bolt-internal-utils']);
	gulp.watch('node_modules/bolt-module-db/**/*', ['copy:bolt-module-db']);
	gulp.watch('node_modules/bolt-module-events/**/*', ['copy:bolt-module-events']);
	gulp.watch('node_modules/bolt-module-system/**/*', ['copy:bolt-module-system']);
	gulp.watch('node_modules/bolt-settings/**/*', ['copy:bolt-settings']);
	gulp.watch('node_modules/bolt-ui-pages/**/*', ['copy:bolt-ui-pages']);
	gulp.watch('node_modules/bolt-ui-sweetalert/**/*', ['copy:bolt-ui-sweetalert']);
	gulp.watch('node_modules/ctl-sms-home/**/*', ['copy:ctl-sms-home']);
	gulp.watch('node_modules/ctl-sms-students/**/*', ['copy:ctl-sms-students']);
});