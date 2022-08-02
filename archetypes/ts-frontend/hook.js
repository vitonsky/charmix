const { readFile } = require('fs-extra');
const glob = require('glob-promise');
const path = require('path');
const { parse, stringify } = require('comment-json');

const rootDirectory = path.dirname(__filename);

const prepareFile = (file, options) => {
	const basename = path.basename(file.path);

	// Add project name
	if (options.name && basename === 'package.json') {
		const json = parse(file.contents.toString('utf-8'));

		json.name = options.name;

		file.contents = Buffer.from(stringify(json, null, 2));
	}

	// Add react rules to configs
	if (options.useReact) {
		switch (basename) {
		case '.eslintrc': {
			const json = parse(file.contents.toString('utf-8'));

			json.plugins.push('react-hooks');
			json.extends.push('plugin:react-hooks/recommended');

			file.contents = Buffer.from(stringify(json, null, 2));
			break;
		}
		case 'package.json': {
			const json = parse(file.contents.toString('utf-8'));

			json.devDependencies['eslint-plugin-react'] = '^7.30.0';
			json.devDependencies['eslint-plugin-react-hooks'] = '^4.5.0';

			file.contents = Buffer.from(stringify(json, null, 2));
			break;
		}
		case 'tsconfig.json': {
			const json = parse(file.contents.toString('utf-8'));

			json.compilerOptions.jsx = 'react';

			file.contents = Buffer.from(stringify(json, null, 2));
			break;
		}
		}
	}

	return file;
};

module.exports.getFiles = async (options, { addFile }) => {
	const files = await glob('./files/**', {
		dot: true,
		nodir: true,
		absolute: true,
		cwd: rootDirectory,
	});

	const filesDir = path.resolve(rootDirectory, './files') + '/';
	for (const filePath of files) {
		const filename = filePath.slice(filesDir.length);
		const contents = await readFile(filePath);

		const preparedFile = prepareFile({ path: filename, contents }, options.options);

		if (preparedFile) {
			addFile(preparedFile);
		}
	}
};
