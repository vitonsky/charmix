import path from 'path';

import fsextra from 'fs-extra';
import glob from 'glob-promise';

import { isResourceExist } from '../../utils';
import { getArchetypeManifest } from '../utils';
import { FilesPattern } from '..';

const getArrayOfFilesPattern = (pattern: FilesPattern) =>
	Array.isArray(pattern) ? pattern : [pattern];

export class StaticTemplateArchetype {
	public apply = async (archetypeDir: string, destination: string) => {
		const manifest = await getArchetypeManifest(archetypeDir);

		if (!manifest) {
			throw new Error('Manifest not found');
		}
		if (manifest.type !== 'staticTemplate') {
			throw new Error('Invalid type of archetype');
		}

		// Get paths
		let globPathsToInclude: string[] = [];
		let globPathsToExclude: string[] = [];
		if (Array.isArray(manifest.files) || typeof manifest.files === 'string') {
			globPathsToInclude = getArrayOfFilesPattern(manifest.files);
		} else {
			globPathsToInclude = getArrayOfFilesPattern(manifest.files.include);
			globPathsToExclude = getArrayOfFilesPattern(manifest.files.exclude ?? []);
		}

		// Find files from manifest
		let filesToCopy: string[] = [];
		for (const resource of globPathsToInclude) {
			const foundResources = await glob(resource, {
				ignore: globPathsToExclude,
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

		// Copy files and directories
		await Promise.all(
			filesToCopy.map(async (filename) => {
				const destPath = path.join(destination, path.basename(filename));
				await fsextra.copy(filename, destPath);
			}),
		);
	};
}
