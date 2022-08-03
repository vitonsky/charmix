import path from 'path';

import { ensureDir, pathExists } from 'fs-extra';

import { getArchetypeManifest } from '../utils';
import { writeFile } from 'fs/promises';

import { CriticalError, executeCommand } from '../../utils';

export type File = {
	path: string;
	contents: Buffer;
};

export type HookControls = {
	addFile: (file: File) => void;
};

export type HookOptions = {
	/**
	 * Path to archetype directory
	 */
	archetypePath: string;

	/**
	 * Path to target directory to apply hook
	 */
	targetPath: string;

	/**
	 * Options provided by user to configure data
	 */
	options: Record<any, any>;
};

/**
 * Object that a hook module return
 */
export type HookModule = {
	getFiles: (properties: HookOptions, controls: HookControls) => Promise<void | File[]>;
};

export class HookArchetype {
	private getModule = (src: string): HookModule => {
		const module = require(src);

		if (typeof module !== 'object') {
			throw Error('Invalid type of module');
		}

		// Check type of required hooks
		const requiredHooks = ['getFiles'];
		requiredHooks.forEach((hookName) => {
			if (!(hookName in module)) {
				throw Error(`Hook ${hookName} is not found in module`);
			}
			if (typeof module[hookName] !== 'function') {
				throw Error(`Invalid type of hook ${hookName}`);
			}
		});

		return module;
	};

	public apply = async ({
		archetypeDir,
		destination,
		parameters,
	}: {
		archetypeDir: string;
		destination: string;
		parameters: Record<any, any>;
	}) => {
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
			console.log(`Run archetype hook`);
			files = await getFiles(
				{
					archetypePath: archetypeDir,
					targetPath: destination,
					options: parameters,
				},
				{ addFile },
			);
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
