import { ArchetypeEntry } from '.';
import { getArchetypeManifest } from './utils';
import { ArchetypeFetcher } from './ArchetypeFetcher';
import { FsFetcher } from './ArchetypeFetcher/FsFetcher';
import { GitFetcher } from './ArchetypeFetcher/GitFetcher';
import { NpmFetcher } from './ArchetypeFetcher/NpmFetcher';
import { CriticalError } from '../utils';

type ArchetypeManagerOptions = {
	cacheDir: string;
};

/**
 * Manage archetypes
 */
export class ArchetypeManager {
	protected options: ArchetypeManagerOptions;
	constructor(options: ArchetypeManagerOptions) {
		this.options = options;
	}

	private fetchArchetype = async (archetype: ArchetypeEntry) => {
		const { cacheDir } = this.options;

		const fetchers: Record<ArchetypeEntry['type'], ArchetypeFetcher> = {
			git: new GitFetcher(cacheDir),
			local: new FsFetcher(cacheDir),
			npm: new NpmFetcher(cacheDir),
		};

		let archetypeDir: string;
		if (archetype.type in fetchers) {
			const fetcher = fetchers[archetype.type];
			archetypeDir = await fetcher.fetch(archetype.src);
		} else {
			throw new CriticalError('Unknown type of archetype');
		}

		return archetypeDir;
	};

	public getArchetypeInfo = async (archetype: ArchetypeEntry) => {
		const directory = await this.fetchArchetype(archetype);

		const manifest = await getArchetypeManifest(directory);
		if (manifest === null) {
			throw new CriticalError(
				`Manifest of archetype "${archetype.name}" is not found`,
			);
		}

		return { directory, manifest };
	};
}
