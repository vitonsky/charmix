import path from 'path';

import { ensureDir, pathExists } from 'fs-extra';

import { getArchetypeManifest } from './utils';
import { writeFile } from 'fs/promises';

export type File = {
	path: string;
	contents: Buffer;
};

export type ProvidedControls = {
	addFile: (file: File) => void;
};

export type HookModule = {
	getFiles: (
		parameters: Record<any, any>,
		controls: ProvidedControls,
	) => Promise<void | File[]>;
};

export class HookArchetype {
	private getModule = (src: string): HookModule => {
		// TODO: add validation
		const module = require(src);
		return module;
	};

	public apply = async (archetypeDir: string, destination: string) => {
		const manifest = await getArchetypeManifest(archetypeDir);

		if (!manifest) {
			throw new Error('Manifest not found');
		}
		if (manifest.type !== 'hook') {
			throw new Error('Invalid type of archetype');
		}

		const hookModulePath = path.resolve(archetypeDir, manifest.hook);

		if (!hookModulePath.startsWith(path.resolve(archetypeDir))) {
			throw new Error('Hook must be placed inside of archetype directory');
		}

		const filePromises: Promise<any>[] = [];
		const addFile = async (file: File) => {
			// TODO: add file validation
			filePromises.push(
				(async () => {
					const filePath = path.resolve(destination, file.path);

					if (!filePath.startsWith(path.resolve(destination))) {
						throw new Error("Files can't be write out of current directory");
					}

					if (await pathExists(filePath)) {
						console.warn(`Skip file "${filePath}" to prevent override`);
						return;
					}

					await ensureDir(path.dirname(filePath));
					await writeFile(filePath, file.contents);
				})(),
			);
		};

		const { getFiles } = this.getModule(hookModulePath);

		// TODO: handle script errors?
		// TODO: provide parameters
		const files = await getFiles({}, { addFile });

		// TODO: add files validation
		if (Array.isArray(files)) {
			await Promise.all(files.map((file) => addFile(file)));
		}

		await Promise.all(filePromises);
	};
}
