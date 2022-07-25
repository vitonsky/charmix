import path from 'path';
import fs from 'fs/promises';
import fsextra from 'fs-extra';

import glob from 'glob-promise';
import { isResourceExist } from './utils';

export type ArchetypeEntry = {
	name: string;
	type: 'git';
	src: string;
};

export type ArchetypeStaticTemplate = {
	type: 'staticTemplate';
	files: string | string[];
};

export type ArchetypeConfigHook = {
	type: 'configHook';
	hooks: string;
};

export type ArchetypeCli = {
	type: 'cli';
	command: string;
};

export type ArchetypeManifest = {
	name?: string;
	version?: string;
} & (ArchetypeStaticTemplate | ArchetypeConfigHook | ArchetypeCli);

export enum ARCHETYPE_TYPE {
	STATIC_TEMPLATE = 'staticTemplate',
}

const getArchetypeManifest = async (dir: string) => {
	try {
		const metaFileName = 'archetype.json';

		const filename = path.join(dir, metaFileName);

		const fileBuffer = await fs.readFile(filename);
		const rawData = fileBuffer.toString('utf-8');

		// TODO: add validation
		return JSON.parse(rawData) as ArchetypeManifest;
	} catch {
		return null;
	}
};

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

export class StaticTemplateArchetype {
	public apply = async (archetypeDir: string, destination: string) => {
		const manifest = await getArchetypeManifest(archetypeDir);

		if (!manifest) {
			throw new Error('Manifest not found');
		}
		if (manifest.type !== 'staticTemplate') {
			throw new Error('Invalid type of archetype');
		}

		let filesToCopy: string[] = [];

		// Find files from manifest
		const globPaths = Array.isArray(manifest.files)
			? manifest.files
			: [manifest.files];
		for (const resource of globPaths) {
			const foundResources = await glob(resource, {
				dot: true,
				cwd: archetypeDir,
				root: archetypeDir,
				absolute: true,
			});

			for (const resourcePath of foundResources) {
				if (resourcePath.slice(0, archetypeDir.length) !== archetypeDir) {
					throw new Error("Archetype can't specify files out of its directory");
				}

				const isExists = await isResourceExist(resourcePath);
				if (!isExists) {
					throw new Error('Resource is not available');
				}

				filesToCopy.push(resourcePath);
			}
		}

		// Remove duplicates
		filesToCopy = filesToCopy.filter((path, idx, arr) => arr.indexOf(path) === idx);

		console.log({ filesToCopy, destination });

		// Copy files and directories
		await Promise.all(
			filesToCopy.map(async (filename) => {
				const destPath = path.join(destination, path.basename(filename));
				await fsextra.copy(filename, destPath);
			}),
		);
	};
}
