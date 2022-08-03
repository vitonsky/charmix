const gulp = require('gulp');
const ts = require('gulp-typescript');
const mergeStream = require('merge-stream');
const clean = require('gulp-clean');
const replace = require('gulp-replace');

const cleanPackageJson = require('./scripts/gulp/cleanPackageJson');

const buildDir = 'dist';
const gitPublicMainPath = 'https://github.com/vitonsky/charmix/tree/master';

const isProduction = process.env.NODE_ENV === 'production';

const tsProject = ts.createProject('tsconfig.json', {
	module: 'commonjs',

	// Don't check types for dev mode
	isolatedModules: !isProduction,
});

function buildCjs() {
	return gulp.src(['src/**/*.ts']).pipe(tsProject()).pipe(gulp.dest(buildDir));
}

function copyMetaFiles() {
	const devFiles = ['./archetypes.json'];

	return mergeStream([
		mergeStream(
			// Clean package.json
			gulp.src(['./package.json']).pipe(cleanPackageJson()),
			// Replace relative links to github links
			gulp.src(['./README.md']).pipe(replace(/\.\//g, gitPublicMainPath + '/')),
			// Copy additional files
			gulp.src(isProduction ? [] : devFiles, {
				allowEmpty: true,
			}),
		).pipe(gulp.dest(buildDir)),
		gulp.src(['./bin/**']).pipe(gulp.dest(buildDir + '/bin')),
	]);
}

function cleanDist() {
	return gulp.src(buildDir, { allowEmpty: true, read: false }).pipe(clean());
}

function watchFiles() {
	return gulp.watch(['src/**/*.ts'], gulp.series([copyMetaFiles, buildCjs]));
}

module.exports.default = gulp.series([cleanDist, copyMetaFiles, buildCjs]);
module.exports.clean = cleanDist;
module.exports.watch = gulp.series([module.exports.default, watchFiles]);
