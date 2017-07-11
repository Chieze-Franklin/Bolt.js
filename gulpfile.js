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
gulp.task('test:acceptance', function(){
});
gulp.task('test:style', ['jslint'], function(){
});
gulp.task('test:unit', function(){
});

/*
	npm doesn't allow git repos in node_modules...
	there are different ways to solve this issue, including altering the source code of npm
	but I don't want to do that
	instead, I keep the "pure" npm modules in node_modules
	and use gulp watch-dev to sync those modules with their development counterparts in node_modules-dev
*/

gulp.task('copy:bolt-internal-checks', function(){
	return gulp.src(['node_modules/bolt-internal-checks/**/*', 'node_modules/bolt-internal-checks/.*', 
					 '!node_modules/bolt-internal-checks/node_modules', '!node_modules/bolt-internal-checks/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-checks'))
});
gulp.task('copy:bolt-internal-config', function(){
	return gulp.src(['node_modules/bolt-internal-config/**/*', 'node_modules/bolt-internal-config/.*', 
					 '!node_modules/bolt-internal-config/node_modules', '!node_modules/bolt-internal-config/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-config'))
});
gulp.task('copy:bolt-internal-defs', function(){
	return gulp.src(['node_modules/bolt-internal-defs/**/*', 'node_modules/bolt-internal-defs/.*', 
					 '!node_modules/bolt-internal-defs/node_modules', '!node_modules/bolt-internal-defs/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-defs'))
});
gulp.task('copy:bolt-internal-errors', function(){
	return gulp.src(['node_modules/bolt-internal-errors/**/*', 'node_modules/bolt-internal-errors/.*', 
					 '!node_modules/bolt-internal-errors/node_modules', '!node_modules/bolt-internal-errors/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-errors'))
});
gulp.task('copy:bolt-internal-get-routes', function(){
	return gulp.src(['node_modules/bolt-internal-get-routes/**/*', 'node_modules/bolt-internal-get-routes/.*', 
					 '!node_modules/bolt-internal-get-routes/node_modules', '!node_modules/bolt-internal-get-routes/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-get-routes'))
});
gulp.task('copy:bolt-internal-models', function(){
	return gulp.src(['node_modules/bolt-internal-models/**/*', 'node_modules/bolt-internal-models/.*', 
					 '!node_modules/bolt-internal-models/node_modules', '!node_modules/bolt-internal-models/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-models'))
});
gulp.task('copy:bolt-internal-schemata', function(){
	return gulp.src(['node_modules/bolt-internal-schemata/**/*', 'node_modules/bolt-internal-schemata/.*', 
					 '!node_modules/bolt-internal-schemata/node_modules', '!node_modules/bolt-internal-schemata/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-schemata'))
});
gulp.task('copy:bolt-internal-setup', function(){
	return gulp.src(['node_modules/bolt-internal-setup/**/*', 'node_modules/bolt-internal-setup/.*', 
					 '!node_modules/bolt-internal-setup/node_modules', '!node_modules/bolt-internal-setup/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-setup'))
});
gulp.task('copy:bolt-internal-sockets', function(){
	return gulp.src(['node_modules/bolt-internal-sockets/**/*', 'node_modules/bolt-internal-sockets/.*', 
					 '!node_modules/bolt-internal-sockets/node_modules', '!node_modules/bolt-internal-sockets/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-sockets'))
});
gulp.task('copy:bolt-internal-utils', function(){
	return gulp.src(['node_modules/bolt-internal-utils/**/*', 'node_modules/bolt-internal-utils/.*', 
					 '!node_modules/bolt-internal-utils/node_modules', '!node_modules/bolt-internal-utils/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-internal-utils'))
});
gulp.task('copy:bolt-module-dashboard', function(){
	return gulp.src(['node_modules/bolt-module-dashboard/**/*', 'node_modules/bolt-module-dashboard/.*', 
					 '!node_modules/bolt-module-dashboard/node_modules', '!node_modules/bolt-module-dashboard/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-dashboard'))
});
gulp.task('copy:bolt-module-db', function(){
	return gulp.src(['node_modules/bolt-module-db/**/*', 'node_modules/bolt-module-db/.*', 
					 '!node_modules/bolt-module-db/node_modules', '!node_modules/bolt-module-db/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-db'))
});
gulp.task('copy:bolt-module-fs', function(){
	return gulp.src(['node_modules/bolt-module-fs/**/*', 'node_modules/bolt-module-fs/.*', 
					 '!node_modules/bolt-module-fs/node_modules', '!node_modules/bolt-module-fs/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-fs'))
});
gulp.task('copy:bolt-module-notifications', function(){
	return gulp.src(['node_modules/bolt-module-notifications/**/*', 'node_modules/bolt-module-notifications/.*', 
					 '!node_modules/bolt-module-notifications/node_modules', '!node_modules/bolt-module-notifications/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-notifications'))
});
gulp.task('copy:bolt-module-system', function(){
	return gulp.src(['node_modules/bolt-module-system/**/*', 'node_modules/bolt-module-system/.*', 
					 '!node_modules/bolt-module-system/node_modules', '!node_modules/bolt-module-system/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-module-system'))
});
gulp.task('copy:bolt-admin', function(){
	return gulp.src(['node_modules/bolt-admin/**/*', 'node_modules/bolt-admin/.*', 
					 '!node_modules/bolt-admin/node_modules', '!node_modules/bolt-admin/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-admin'))
});
gulp.task('copy:bolt-settings', function(){
	return gulp.src(['node_modules/bolt-settings/**/*', 'node_modules/bolt-settings/.*', 
					 '!node_modules/bolt-settings/node_modules', '!node_modules/bolt-settings/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-settings'))
});
gulp.task('copy:bolt-ui-pages', function(){
	return gulp.src(['node_modules/bolt-ui-pages/**/*', 'node_modules/bolt-ui-pages/.*', 
					 '!node_modules/bolt-ui-pages/node_modules', '!node_modules/bolt-ui-pages/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-ui-pages'))
});
gulp.task('copy:bolt-ui-sweetalert', function(){
	return gulp.src(['node_modules/bolt-ui-sweetalert/**/*', 'node_modules/bolt-ui-sweetalert/.*', 
					 '!node_modules/bolt-ui-sweetalert/node_modules', '!node_modules/bolt-ui-sweetalert/.coveralls.yml'])
		.pipe(gulp.dest('node_modules-dev/bolt-ui-sweetalert'))
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
gulp.task('del:bolt-module-dashboard', function(){
	return del(['node_modules-dev/bolt-module-dashboard/**/*', '!node_modules-dev/bolt-module-dashboard/.git'])
});
gulp.task('del:bolt-module-db', function(){
	return del(['node_modules-dev/bolt-module-db/**/*', '!node_modules-dev/bolt-module-db/.git'])
});
gulp.task('del:bolt-module-fs', function(){
	return del(['node_modules-dev/bolt-module-fs/**/*', '!node_modules-dev/bolt-module-fs/.git'])
});
gulp.task('del:bolt-module-notifications', function(){
	return del(['node_modules-dev/bolt-module-notifications/**/*', '!node_modules-dev/bolt-module-notifications/.git'])
});
gulp.task('del:bolt-module-system', function(){
	return del(['node_modules-dev/bolt-module-system/**/*', '!node_modules-dev/bolt-module-system/.git'])
});
gulp.task('del:bolt-admin', function(){
	return del(['node_modules-dev/bolt-admin/**/*', '!node_modules-dev/bolt-admin/.git'])
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

gulp.task('watch-dev', function(){
	gulp.watch(['node_modules/bolt-internal-checks/**/*', 'node_modules/bolt-internal-checks/.*'], 
		function(){runSequence('del:bolt-internal-checks', 'copy:bolt-internal-checks')});
	gulp.watch(['node_modules/bolt-internal-config/**/*', 'node_modules/bolt-internal-config/.*'], 
		function(){runSequence('del:bolt-internal-config', 'copy:bolt-internal-config')});
	gulp.watch(['node_modules/bolt-internal-defs/**/*', 'node_modules/bolt-internal-defs/.*'], 
		function(){runSequence('del:bolt-internal-defs', 'copy:bolt-internal-defs')});
	gulp.watch(['node_modules/bolt-internal-errors/**/*', 'node_modules/bolt-internal-errors/.*'], 
		function(){runSequence('del:bolt-internal-errors', 'copy:bolt-internal-errors')});
	gulp.watch(['node_modules/bolt-internal-get-routes/**/*', 'node_modules/bolt-internal-get-routes/.*'], 
		function(){runSequence('del:bolt-internal-get-routes', 'copy:bolt-internal-get-routes')});
	gulp.watch(['node_modules/bolt-internal-models/**/*', 'node_modules/bolt-internal-models/.*'], 
		function(){runSequence('del:bolt-internal-models', 'copy:bolt-internal-models')});
	gulp.watch(['node_modules/bolt-internal-schemata/**/*', 'node_modules/bolt-internal-schemata/.*'], 
		function(){runSequence('del:bolt-internal-schemata', 'copy:bolt-internal-schemata')});
	gulp.watch(['node_modules/bolt-internal-setup/**/*', 'node_modules/bolt-internal-setup/.*'], 
		function(){runSequence('del:bolt-internal-setup', 'copy:bolt-internal-setup')});
	gulp.watch(['node_modules/bolt-internal-sockets/**/*', 'node_modules/bolt-internal-sockets/.*'], 
		function(){runSequence('del:bolt-internal-sockets', 'copy:bolt-internal-sockets')});
	gulp.watch(['node_modules/bolt-internal-utils/**/*', 'node_modules/bolt-internal-utils/.*'], 
		function(){runSequence('del:bolt-internal-utils', 'copy:bolt-internal-utils')});
	gulp.watch(['node_modules/bolt-module-dashboard/**/*', 'node_modules/bolt-module-dashboard/.*'], 
		function(){runSequence('del:bolt-module-dashboard', 'copy:bolt-module-dashboard')});
	gulp.watch(['node_modules/bolt-module-db/**/*', 'node_modules/bolt-module-db/.*'], 
		function(){runSequence('del:bolt-module-db', 'copy:bolt-module-db')});
	gulp.watch(['node_modules/bolt-module-fs/**/*', 'node_modules/bolt-module-fs/.*'], 
		function(){runSequence('del:bolt-module-fs', 'copy:bolt-module-fs')});
	gulp.watch(['node_modules/bolt-module-notifications/**/*', 'node_modules/bolt-module-notifications/.*'], 
		function(){runSequence('del:bolt-module-notifications', 'copy:bolt-module-notifications')});
	gulp.watch(['node_modules/bolt-module-system/**/*', 'node_modules/bolt-module-system/.*'], 
		function(){runSequence('del:bolt-module-system', 'copy:bolt-module-system')});
	gulp.watch(['node_modules/bolt-admin/**/*', 'node_modules/bolt-admin/.*'], 
		function(){runSequence('del:bolt-admin', 'copy:bolt-admin')});
	gulp.watch(['node_modules/bolt-settings/**/*', 'node_modules/bolt-settings/.*'], 
		function(){runSequence('del:bolt-settings', 'copy:bolt-settings')});
	gulp.watch(['node_modules/bolt-ui-pages/**/*', 'node_modules/bolt-ui-pages/.*'], 
		function(){runSequence('del:bolt-ui-pages', 'copy:bolt-ui-pages')});
	gulp.watch(['node_modules/bolt-ui-sweetalert/**/*', 'node_modules/bolt-ui-sweetalert/.*'], 
		function(){runSequence('del:bolt-ui-sweetalert', 'copy:bolt-ui-sweetalert')});
});