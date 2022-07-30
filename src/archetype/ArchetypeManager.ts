import { ArchetypeReference } from '.';
import { getArchetypeManifest } from './utils';
import { ArchetypeFetcher } from './ArchetypeFetcher';
import { FsFetcher } from './ArchetypeFetcher/FsFetcher';
import { GitFetcher } from './ArchetypeFetcher/GitFetcher';
import { NpmFetcher } from './ArchetypeFetcher/NpmFetcher';
import { CriticalError, isResourceExist } from '../utils';
import path from 'path';
import { ensureDir, move, rm } from 'fs-extra';

type ArchetypeManagerOptions = {
	cacheDir: string;
};

/**
 * Normalize filename to use in file system
 */
export const escapeFilename = (filename: string) => filename;

/**
 * Manage archetypes
 */
export class ArchetypeManager {
	protected archetypesDir: string;
	protected tmpDir: string;

	protected options: ArchetypeManagerOptions;
	constructor(options: ArchetypeManagerOptions) {
		this.options = options;
		this.archetypesDir = path.join(options.cacheDir, 'archetypes');
		this.tmpDir = path.join(options.cacheDir, 'tmp');
	}

	/**
	 * Download archetype to specified directory
	 * @returns path to directory contains archetype files
	 */
	private fetchArchetype = async (
		archetype: ArchetypeReference,
		archetypesDir: string,
	) => {
		const fetchers: Record<ArchetypeReference['type'], ArchetypeFetcher> = {
			git: new GitFetcher(archetypesDir),
			local: new FsFetcher(archetypesDir),
			npm: new NpmFetcher(archetypesDir),
		};

		if (archetype.type in fetchers) {
			const fetcher = fetchers[archetype.type];
			return await fetcher.fetch(archetype.src);
		} else {
			throw new CriticalError('Unknown type of archetype');
		}
	};

	private getArchetypeDirPath = (
		archetype: ArchetypeReference,
		options?: { temporary?: boolean },
	) => {
		const { temporary = false } = options ?? {};
		return path.join(
			temporary ? this.tmpDir : this.archetypesDir,
			escapeFilename(archetype.name),
		);
	};

	// TODO: add case when name is not specified
	public install = async (archetype: ArchetypeReference) => {
		const archetypePath = this.getArchetypeDirPath(archetype);

		const isArchetypeInstalled = await isResourceExist(archetypePath);
		if (isArchetypeInstalled) {
			throw Error(`Archetype is already installed`);
		}

		const tmpPath = this.getArchetypeDirPath(archetype, { temporary: true });

		// Delete directory to clean install
		await rm(tmpPath, { force: true, recursive: true });
		await ensureDir(tmpPath);

		// Fetch
		const archetypeTmpPath = await this.fetchArchetype(archetype, tmpPath);

		// Validate structure
		const manifest = await getArchetypeManifest(archetypeTmpPath);
		if (manifest === null) {
			throw new Error(`Manifest is not found`);
		}

		// Copy temporary files
		console.log(archetypeTmpPath, archetypePath);
		await move(archetypeTmpPath, archetypePath);
	};

	public getArchetypeInfo = async (archetype: ArchetypeReference) => {
		const archetypePath = this.getArchetypeDirPath(archetype);

		// Ensure archetype installed
		const isArchetypeInstalled = await isResourceExist(archetypePath);
		if (!isArchetypeInstalled) {
			await this.install(archetype);
		}

		const manifest = await getArchetypeManifest(archetypePath);
		if (manifest === null) {
			throw new CriticalError(
				`Manifest of archetype "${archetype.name}" is not found`,
			);
		}

		return { directory: archetypePath, manifest };
	};
}
