//the new package.json shud actually derive fro the existing one

var gulp = require('gulp');

var del = require('del');
var jslint = require('gulp-jslint');
var runSequence = require('run-sequence');

gulp.task('build', function(){
	runSequence('del:build', 'copy:build');
});
gulp.task('copy:build', function(){
	gulp.src(['public/bolt/native/**/*'])
		.pipe(gulp.dest('dist/public/bolt/native'))
	gulp.src(['public/bolt/users/user.png'])
		.pipe(gulp.dest('dist/public/bolt/users'))
	gulp.src(['sys/bins/mongodb/darwin/**/*'])
		.pipe(gulp.dest('dist/sys/bin/mongodb/darwin'))
	gulp.src(['sys/bins/mongodb/linux/**/*'])
		.pipe(gulp.dest('dist/sys/bin/mongodb/linux'))
	gulp.src(['sys/bins/mongodb/win32/**/*'])
		.pipe(gulp.dest('dist/sys/bin/mongodb/win32'))
	gulp.src(['sys/data/mongodb/', '!sys/data/mongodb/**/*'])
		.pipe(gulp.dest('dist/sys/data'))
	gulp.src(['sys/server/**/*'])
		.pipe(gulp.dest('dist/sys/server'))
	gulp.src(['sys/views/**/*'])
		.pipe(gulp.dest('dist/sys/views'))
	gulp.src(['node_modules/bolt-*/**/*'])
		.pipe(gulp.dest('dist/node_modules'))
	gulp.src(['bolt.js', '_docs/LICENSE', '_docs/README.md', '_docs/package.json'])
		.pipe(gulp.dest('dist'))
});
gulp.task('del:build', function(){
	return del(['dist/**/*'])
});

gulp.task('jslint', function(){
	return gulp.src(['bolt.js', 'sys/**/*.js'])
		.pipe(jslint())
		.pipe(jslint.reporter('stylish'))
});

gulp.task('test', ['jslint'], function(){
});
gulp.task('test:behaviour', function(){
});
gulp.task('test:style', ['jslint'], function(){
});

/*
	npm doesn't allow git repos in node_modules...
	there are different ways to solve this issue, including altering the source code of npm
	but I don't want to do that
	instead, I keep the "pure" npm modules in node_modules
	and use gulp watch-dev to sync those modules with their development counterparts in node_modules-dev
*/

gulp.task('copy:bolt-internal-checks', function(){
	return gulp.src(['node_modules/bolt-internal-checks/**/*', '!node_modules/bolt-internal-checks/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-checks'))
});
gulp.task('copy:bolt-internal-config', function(){
	return gulp.src(['node_modules/bolt-internal-config/**/*', '!node_modules/bolt-internal-config/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-config'))
});
gulp.task('copy:bolt-internal-defs', function(){
	return gulp.src(['node_modules/bolt-internal-defs/**/*', '!node_modules/bolt-internal-defs/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-defs'))
});
gulp.task('copy:bolt-internal-errors', function(){
	return gulp.src(['node_modules/bolt-internal-errors/**/*', '!node_modules/bolt-internal-errors/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-errors'))
});
gulp.task('copy:bolt-internal-get-routes', function(){
	return gulp.src(['node_modules/bolt-internal-get-routes/**/*', '!node_modules/bolt-internal-get-routes/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-get-routes'))
});
gulp.task('copy:bolt-internal-models', function(){
	return gulp.src(['node_modules/bolt-internal-models/**/*', '!node_modules/bolt-internal-models/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-models'))
});
gulp.task('copy:bolt-internal-schemata', function(){
	return gulp.src(['node_modules/bolt-internal-schemata/**/*', '!node_modules/bolt-internal-schemata/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-schemata'))
});
gulp.task('copy:bolt-internal-setup', function(){
	return gulp.src(['node_modules/bolt-internal-setup/**/*', '!node_modules/bolt-internal-setup/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-setup'))
});
gulp.task('copy:bolt-internal-sockets', function(){
	return gulp.src(['node_modules/bolt-internal-sockets/**/*', '!node_modules/bolt-internal-sockets/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-sockets'))
});
gulp.task('copy:bolt-internal-utils', function(){
	return gulp.src(['node_modules/bolt-internal-utils/**/*', 'node_modules/bolt-internal-utils/.*', '!node_modules/bolt-internal-utils/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-utils'))
});
gulp.task('copy:bolt-module-db', function(){
	return gulp.src(['node_modules/bolt-module-db/**/*', '!node_modules/bolt-module-db/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-db'))
});
gulp.task('copy:bolt-module-events', function(){
	return gulp.src(['node_modules/bolt-module-events/**/*', '!node_modules/bolt-module-events/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-events'))
});
gulp.task('copy:bolt-module-system', function(){
	return gulp.src(['node_modules/bolt-module-system/**/*', '!node_modules/bolt-module-system/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-system'))
});
gulp.task('copy:bolt-settings', function(){
	return gulp.src(['node_modules/bolt-settings/**/*', '!node_modules/bolt-settings/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-settings'))
});
gulp.task('copy:bolt-ui-pages', function(){
	return gulp.src(['node_modules/bolt-ui-pages/**/*', '!node_modules/bolt-ui-pages/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-ui-pages'))
});
gulp.task('copy:bolt-ui-sweetalert', function(){
	return gulp.src(['node_modules/bolt-ui-sweetalert/**/*', '!node_modules/bolt-ui-sweetalert/node_modules'])
		.pipe(gulp.dest('node_modules-dev/bolt-ui-sweetalert'))
});
gulp.task('copy:ctl-sms-home', function(){
	return gulp.src(['node_modules/ctl-sms-home/**/*', '!node_modules/ctl-sms-home/node_modules'])
		.pipe(gulp.dest('node_modules-dev/ctl-sms-home'))
});
gulp.task('copy:ctl-sms-students', function(){
	return gulp.src(['node_modules/ctl-sms-students/**/*', '!node_modules/ctl-sms-students/node_modules'])
		.pipe(gulp.dest('node_modules-dev/ctl-sms-students'))
});

gulp.task('del:bolt-internal-checks', function(){
	return del(['node_modules-dev/bolt-internal-checks/**/*', '!node_modules-dev/bolt-internal-checks/.git'])
});
gulp.task('del:bolt-internal-config', function(){
	return del(['node_modules-dev/bolt-internal-config/**/*', '!node_modules-dev/bolt-internal-config/.git'])
});
gulp.task('del:bolt-internal-defs', function(){
	return del(['node_modules-dev/bolt-internal-defs/**/*', '!node_modules-dev/bolt-internal-defs/.git'])
});
gulp.task('del:bolt-internal-errors', function(){
	return del(['node_modules-dev/bolt-internal-errors/**/*', '!node_modules-dev/bolt-internal-errors/.git'])
});
gulp.task('del:bolt-internal-get-routes', function(){
	return del(['node_modules-dev/bolt-internal-get-routes/**/*', '!node_modules-dev/bolt-internal-get-routes/.git'])
});
gulp.task('del:bolt-internal-models', function(){
	return del(['node_modules-dev/bolt-internal-models/**/*', '!node_modules-dev/bolt-internal-models/.git'])
});
gulp.task('del:bolt-internal-schemata', function(){
	return del(['node_modules-dev/bolt-internal-schemata/**/*', '!node_modules-dev/bolt-internal-schemata/.git'])
});
gulp.task('del:bolt-internal-setup', function(){
	return del(['node_modules-dev/bolt-internal-setup/**/*', '!node_modules-dev/bolt-internal-setup/.git'])
});
gulp.task('del:bolt-internal-sockets', function(){
	return del(['node_modules-dev/bolt-internal-sockets/**/*', '!node_modules-dev/bolt-internal-sockets/.git'])
});
gulp.task('del:bolt-internal-utils', function(){
	return del(['node_modules-dev/bolt-internal-utils/**/*', '!node_modules-dev/bolt-internal-utils/.git'])
});
gulp.task('del:bolt-module-db', function(){
	return del(['node_modules-dev/bolt-module-db/**/*', '!node_modules-dev/bolt-module-db/.git'])
});
gulp.task('del:bolt-module-events', function(){
	return del(['node_modules-dev/bolt-module-events/**/*', '!node_modules-dev/bolt-module-events/.git'])
});
gulp.task('del:bolt-module-system', function(){
	return del(['node_modules-dev/bolt-module-system/**/*', '!node_modules-dev/bolt-module-system/.git'])
});
gulp.task('del:bolt-settings', function(){
	return del(['node_modules-dev/bolt-settings/**/*', '!node_modules-dev/bolt-settings/.git'])
});
gulp.task('del:bolt-ui-pages', function(){
	return del(['node_modules-dev/bolt-ui-pages/**/*', '!node_modules-dev/bolt-ui-pages/.git'])
});
gulp.task('del:bolt-ui-sweetalert', function(){
	return del(['node_modules-dev/bolt-ui-sweetalert/**/*', '!node_modules-dev/bolt-ui-sweetalert/.git'])
});
gulp.task('del:ctl-sms-home', function(){
	return del(['node_modules-dev/ctl-sms-home/**/*', '!node_modules-dev/ctl-sms-home/.git'])
});
gulp.task('del:ctl-sms-students', function(){
	return del(['node_modules-dev/ctl-sms-students/**/*', '!node_modules-dev/ctl-sms-students/.git'])
});

gulp.task('watch-dev', function(){
	gulp.watch('node_modules/bolt-internal-checks/**/*', function(){runSequence('del:bolt-internal-checks', 'copy:bolt-internal-checks')});
	gulp.watch('node_modules/bolt-internal-config/**/*', function(){runSequence('del:bolt-internal-config', 'copy:bolt-internal-config')});
	gulp.watch('node_modules/bolt-internal-defs/**/*', function(){runSequence('del:bolt-internal-defs', 'copy:bolt-internal-defs')});
	gulp.watch('node_modules/bolt-internal-errors/**/*', function(){runSequence('del:bolt-internal-errors', 'copy:bolt-internal-errors')});
	gulp.watch('node_modules/bolt-internal-get-routes/**/*', function(){runSequence('del:bolt-internal-get-routes', 'copy:bolt-internal-get-routes')});
	gulp.watch('node_modules/bolt-internal-models/**/*', function(){runSequence('del:bolt-internal-models', 'copy:bolt-internal-models')});
	gulp.watch('node_modules/bolt-internal-schemata/**/*', function(){runSequence('del:bolt-internal-schemata', 'copy:bolt-internal-schemata')});
	gulp.watch('node_modules/bolt-internal-setup/**/*', function(){runSequence('del:bolt-internal-setup', 'copy:bolt-internal-setup')});
	gulp.watch('node_modules/bolt-internal-sockets/**/*', function(){runSequence('del:bolt-internal-sockets', 'copy:bolt-internal-sockets')});
	gulp.watch(['node_modules/bolt-internal-utils/**/*', 'node_modules/bolt-internal-utils/.*'], 
		function(){runSequence('del:bolt-internal-utils', 'copy:bolt-internal-utils')});
	gulp.watch('node_modules/bolt-module-db/**/*', function(){runSequence('del:bolt-module-db', 'copy:bolt-module-db')});
	gulp.watch('node_modules/bolt-module-events/**/*', function(){runSequence('del:bolt-module-events', 'copy:bolt-module-events')});
	gulp.watch('node_modules/bolt-module-system/**/*', function(){runSequence('del:bolt-module-system', 'copy:bolt-module-system')});
	gulp.watch('node_modules/bolt-settings/**/*', function(){runSequence('del:bolt-settings', 'copy:bolt-settings')});
	gulp.watch('node_modules/bolt-ui-pages/**/*', function(){runSequence('del:bolt-ui-pages', 'copy:bolt-ui-pages')});
	gulp.watch('node_modules/bolt-ui-sweetalert/**/*', function(){runSequence('del:bolt-ui-sweetalert', 'copy:bolt-ui-sweetalert')});
	gulp.watch('node_modules/ctl-sms-home/**/*', function(){runSequence('del:ctl-sms-home', 'copy:ctl-sms-home')});
	gulp.watch('node_modules/ctl-sms-students/**/*', function(){runSequence('del:ctl-sms-students', 'copy:ctl-sms-students')});
});