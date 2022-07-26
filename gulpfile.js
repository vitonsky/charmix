const gulp = require('gulp');
const ts = require('gulp-typescript');
const mergeStream = require('merge-stream');
const clean = require('gulp-clean');

const buildDir = 'dist';

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
			// TODO: clean package.json
			// Clean package.json
			gulp.src(['./package.json']),
			// Copy other
			gulp.src(['./README.md', ...(isProduction ? [] : devFiles)], {
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
