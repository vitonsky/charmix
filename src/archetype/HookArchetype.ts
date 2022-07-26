import path from 'path';

import { ensureDir, pathExists } from 'fs-extra';

import { getArchetypeManifest } from './utils';
import { writeFile } from 'fs/promises';

import { CriticalError, executeCommand } from '../utils';

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
			throw new CriticalError('Manifest not found');
		}
		if (manifest.type !== 'hook') {
			throw new CriticalError('Invalid type of archetype');
		}

		const hookModulePath = path.resolve(archetypeDir, manifest.hook);

		if (!hookModulePath.startsWith(path.resolve(archetypeDir))) {
			throw new CriticalError('Hook must be placed inside of archetype directory');
		}

		// Prepare
		if (manifest.prepareCommand !== undefined) {
			const command = manifest.prepareCommand;

			console.log(`Run prepare script "${command}"\n`);
			const exitCode = await executeCommand(command, { cwd: archetypeDir });
			if (exitCode !== 0) {
				throw new CriticalError(`Prepare script exit with code ${exitCode}`);
			}
		}

		const filePromises: Promise<any>[] = [];
		const addFile = async (file: File) => {
			filePromises.push(
				(async () => {
					const filePath = path.resolve(destination, file.path);

					if (!filePath.startsWith(path.resolve(destination))) {
						console.warn(`Incorrect filename "${filePath}"`);
						throw new CriticalError(
							"Files can't be write out of current directory",
						);
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

		let files;
		try {
			// TODO: provide parameters
			files = await getFiles({}, { addFile });
		} catch (err) {
			throw new CriticalError('Exception while hook execution', {
				cause: err as Error,
			});
		}

		if (Array.isArray(files)) {
			await Promise.all(files.map((file) => addFile(file)));
		}

		await Promise.all(filePromises);
	};
}
