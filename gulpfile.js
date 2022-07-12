const gulp = require('gulp');
const ts = require('gulp-typescript');
const mergeStream = require('merge-stream');

const buildDir = 'dist';

// Helpers
function tsCompilerFactory(outPath, settings) {
	return function compileTS() {
		const tsProject = ts.createProject('tsconfig.json', settings);

		return gulp.src(['src/**/*.ts']).pipe(tsProject()).pipe(gulp.dest(outPath));
	};
}

// Main
function buildCjs() {
	const out = buildDir;

	return tsCompilerFactory(out, { module: 'commonjs' });
}

function copyMetaFiles() {
	return mergeStream([
		mergeStream(
			// Clean package.json
			gulp.src(['./package.json']),
			// Copy other
			gulp.src(['./README.md']),
		).pipe(gulp.dest(buildDir)),
		gulp.src(['./bin/**']).pipe(gulp.dest(buildDir + '/bin')),
	]);
}

// TODO: implement dev mode with watch and incremental building
// Compilations
const fullBuild = gulp.series([copyMetaFiles, buildCjs()]);

module.exports.default = fullBuild;
