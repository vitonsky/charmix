const { readFile } = require('fs-extra');
const glob = require('glob-promise');
const path = require('path');
const { parse, stringify } = require('comment-json');

// It's important to use paths relative current file,
// because working directory will different
const rootDirectory = path.dirname(__filename);

/**
 * Function to prepare file.
 *
 * Return file, or nothing to skip file
 */
const prepareFile = (file, options) => {
	// TODO: file transforming...

	return file;
};

module.exports.getFiles = async (options, { addFile }) => {
	// Copy and transform files from directory
	const files = await glob('./files/**', {
		dot: true,
		nodir: true,
		absolute: true,
		cwd: rootDirectory,
	});

	const filesDir = path.resolve(rootDirectory, './files') + '/';
	for (const filePath of files) {
		// Filename will use as absolute, so split unnecessary parts
		const filename = filePath.slice(filesDir.length);
		const contents = await readFile(filePath);

		const preparedFile = prepareFile({ path: filename, contents }, options.options);

		if (preparedFile) {
			addFile(preparedFile);
		}
	}
};
