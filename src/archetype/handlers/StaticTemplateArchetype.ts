import path from 'path';

import fsextra from 'fs-extra';
import glob from 'glob-promise';

import { isResourceExist } from '../../utils';
import { getArchetypeManifest } from '../utils';

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

		// Copy files and directories
		await Promise.all(
			filesToCopy.map(async (filename) => {
				const destPath = path.join(destination, path.basename(filename));
				await fsextra.copy(filename, destPath);
			}),
		);
	};
}
