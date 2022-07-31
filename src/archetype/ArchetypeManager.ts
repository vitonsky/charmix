import path from 'path';
import { ensureDir, mkdtemp, move, rm } from 'fs-extra';

import { ArchetypeReference } from '.';
import { getArchetypeManifest } from './utils';
import { ArchetypeFetcher } from './ArchetypeFetcher';
import { FsFetcher } from './ArchetypeFetcher/FsFetcher';
import { GitFetcher } from './ArchetypeFetcher/GitFetcher';
import { NpmFetcher } from './ArchetypeFetcher/NpmFetcher';
import { CriticalError, isResourceExist } from '../utils';

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
		archetype: Pick<ArchetypeReference, 'type' | 'src'>,
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

	private getArchetypeDirPath = (archetype: ArchetypeReference) => {
		return path.join(this.archetypesDir, escapeFilename(archetype.name));
	};

	/**
	 * Fetch archetype to temporary directory and parse manifest
	 *
	 * It's useful to use and validate archetype with no installing
	 */
	public fetchArchetypeToTempDirectory = async (
		archetype: Pick<ArchetypeReference, 'type' | 'src' | 'path'>,
	) => {
		await ensureDir(this.tmpDir);
		const tmpPath = await mkdtemp(path.join(this.tmpDir, 'archetype-'));

		// Fetch
		const rootArchetypeTmpPath = await this.fetchArchetype(archetype, tmpPath);
		const resolvedArchetypeTmpPath = archetype.path
			? path.resolve(rootArchetypeTmpPath, archetype.path)
			: rootArchetypeTmpPath;

		// Validate structure
		const manifest = await getArchetypeManifest(resolvedArchetypeTmpPath);
		if (manifest === null) {
			throw new Error(`Manifest is not found`);
		}

		return {
			path: rootArchetypeTmpPath,
			manifest,
		};
	};

	public install = async (archetype: ArchetypeReference, installFrom?: string) => {
		const archetypePath = this.getArchetypeDirPath(archetype);

		const isArchetypeInstalled = await isResourceExist(archetypePath);
		if (isArchetypeInstalled) {
			throw Error(`Archetype is already installed`);
		}

		let archetypeTmpPath: string;
		if (installFrom !== undefined) {
			// Use provided archetype directory
			archetypeTmpPath = installFrom;
		} else {
			// Fetch archetype
			const tmpArchetype = await this.fetchArchetypeToTempDirectory(archetype);
			archetypeTmpPath = tmpArchetype.path;
		}

		// Copy temporary files
		const resolvedArchetypeTmpPath = archetype.path
			? path.resolve(archetypeTmpPath, archetype.path)
			: archetypeTmpPath;
		await move(resolvedArchetypeTmpPath, archetypePath);

		// Remove tmp directory for archetypes with specified `path`
		const isTmpDirectoryExist = await isResourceExist(archetypeTmpPath);
		if (isTmpDirectoryExist) {
			await rm(archetypeTmpPath, { force: true, recursive: true });
		}
	};

	public delete = async (archetype: ArchetypeReference) => {
		const archetypePath = this.getArchetypeDirPath(archetype);
		await rm(archetypePath, { force: true, recursive: true });
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
