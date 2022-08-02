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
	const basename = path.basename(file.path);

	const getOptionsArray = () => {
		const trimmedOptions = (options.options ?? '').trim();
		return trimmedOptions ? trimmedOptions.split(',') : [];
	};

	switch (true) {
	case basename === 'archetype.json': {
		const json = parse(file.contents.toString('utf-8'));

		if (options.name) {
			json.name = options.name;
		}

		json.options = getOptionsArray().map((optionName) => ({
			name: optionName.trim(),
		}));

		file.contents = Buffer.from(stringify(json, null, '\t'));
		break;
	}
	case basename === 'package.json': {
		const json = parse(file.contents.toString('utf-8'));

		if (options.name) {
			json.name = options.name;
		}

		file.contents = Buffer.from(stringify(json, null, '\t'));
		break;
	}
	case file.path === 'README.md': {
		const options = getOptionsArray()
			.map((optionName) => '- ' + optionName)
			.join('\n');

		if (options) {
			let text = file.contents.toString('utf-8');

			text += `\n## Options\n${options}\n`;
			file.contents = Buffer.from(text);
		}

		break;
	}
	}

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
