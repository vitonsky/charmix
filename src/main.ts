import path from 'path';
import fs from 'fs/promises';

import { ArgumentParser } from 'argparse';
import clone from 'git-clone/promise';
import { exit } from 'process';
import glob from 'glob-promise';

// TODO: replace this library to something with types
const fx = require('mkdir-recursive');

const mkdir = (path: string) =>
	new Promise<void>((res, rej) => {
		fx.mkdir(path, (err: any) => {
			if (err) {
				rej(err);
			} else {
				res();
			}
		});
	});

const isResourceExist = (filename: string) =>
	fs.access(filename).then(
		() => true,
		() => false,
	);

// TODO: implement configuring
const archetypes = {
	'ts-frontend': {
		type: 'git',
		// Actually you can use path to local directory with git,
		// it's also more secure
		path: 'https://github.com/vitonsky/ts-project-template.git',
	},
};

type Archetype = {
	type: 'git';
	path: string;
};

const rootDir = path.resolve(path.dirname(__filename));
const cacheDir = path.join(rootDir, '.cache');

const getArchetypeFromGit = async (archetype: Archetype) => {
	const repo = archetype.path;

	const gitUrl = new URL(repo);
	const archetypeDir = path.join(cacheDir, gitUrl.hostname, gitUrl.pathname);

	// Ensure getting files
	const isArchetypeDirExist = await isResourceExist(archetypeDir);
	if (!isArchetypeDirExist) {
		console.log('Download repository...');

		// Save repository to cache
		await mkdir(archetypeDir);
		await clone(repo, archetypeDir, { shallow: true });
	}

	return archetypeDir;
};

// TODO: replace `exit` with message to exceptions, catch it on top level and show messages
// it's necessary to abstract CLI logic of actions
(async () => {
	const { version } = require('../package.json');

	const parser = new ArgumentParser({
		description: 'Generate project files structure from archetype',
	});

	parser.add_argument('archetype', { help: 'archetype name' });
	parser.add_argument('-v', '--version', { action: 'version', version });
	// parser.add_argument('-s', '--scripts', { help: 'define allow/disallow scripts' });

	const args = parser.parse_args();
	console.dir(args);

	const archetype = (archetypes as any)[args.archetype] as Archetype | undefined;
	if (!archetype) {
		console.log(`Archetype is not found. Check your config`);
		exit(1);
	}

	await mkdir(cacheDir);

	let archetypeDir: string;
	switch (archetype.type) {
	case 'git':
		archetypeDir = await getArchetypeFromGit(archetype);
		break;
	default:
		console.log('Unknown type of archetype');
		exit(1);
	}

	console.log({ archetypeDir });

	// TODO: run prepare script if allowed

	// TODO: copy files
	// Just copy files from special directory right now, but implement more features in future
	await (async () => {
		const filesDir = path.join(archetypeDir, 'files');
		const isFilesDirExist = await isResourceExist(filesDir);
		if (!isFilesDirExist) {
			console.log('Archetype repository is not contain directory "files" to copy');
			exit(1);
		}

		const filesToCopy = await glob(path.join(filesDir, '{*,**/*}'), { dot: true });

		const destination = path.resolve(process.cwd());
		console.log({ filesToCopy, destination });

		await Promise.all(
			filesToCopy.map(async (filename) => {
				const relativePath = filename.slice(filesDir.length + 1);
				const destPath = path.join(destination, relativePath);

				// Prevent rewrite files
				const isFileExist = await isResourceExist(destPath);
				if (isFileExist) return;

				// Skip directories
				const stat = await fs.lstat(filename);
				if (stat.isDirectory()) return;

				// Ensure exists directory
				const directory = path.dirname(destPath);
				const isDirnameExist = await isResourceExist(directory);
				if (!isDirnameExist) {
					await mkdir(directory).catch((err) => {
						// Skip error about exists dir
						if (err.message.match(/^EEXIST:/)) return;
						throw err;
					});
				}

				// Copy
				await fs.copyFile(filename, destPath);
			}),
		);
	});
})();
