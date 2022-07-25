import path from 'path';
import fs from 'fs/promises';

import { exit } from 'process';
import glob from 'glob-promise';
import { isResourceExist, mkdir } from './utils';

export type ArchetypeEntry = {
	name: string;
	type: 'git';
	src: string;
};

export enum ARCHETYPE_TYPE {
	STATIC_TEMPLATE = 'staticTemplate',
}

export const getArchetypeType = async (
	archetypeDir: string,
): Promise<ARCHETYPE_TYPE | null> => {
	const filesDir = path.join(archetypeDir, 'files');
	const isFilesDirExist = await isResourceExist(filesDir);
	if (isFilesDirExist) {
		return ARCHETYPE_TYPE.STATIC_TEMPLATE;
	}

	return null;
};

// TODO: start use manifest
export class StaticTemplateArchetype {
	public apply = async (archetypeDir: string, destination: string) => {
		const filesDir = path.join(archetypeDir, 'files');
		const isFilesDirExist = await isResourceExist(filesDir);
		if (!isFilesDirExist) {
			console.log('Archetype repository is not contain directory "files" to copy');
			exit(1);
		}

		const filesToCopy = await glob(path.join(filesDir, '{*,**/*}'), { dot: true });

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
	};
}
