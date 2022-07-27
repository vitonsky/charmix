import path from 'path';

import { mkdirp } from 'fs-extra';

import { ArchetypeFetcher } from '../../repository/ArchetypeFetcher';
import { FsFetcher } from '../../repository/ArchetypeFetcher/FsFetcher';
import { GitFetcher } from '../../repository/ArchetypeFetcher/GitFetcher';

import { StaticTemplateArchetype } from '../../archetype/StaticTemplateArchetype';
import { HookArchetype } from '../../archetype/HookArchetype';
import { ArchetypeEntry, ARCHETYPE_TYPE } from '../../archetype';
import { getArchetypeManifest } from '../../archetype/utils';
import { CriticalError } from '../../utils';

import { CliCommand, CommandsBuilder } from './CliCommand';
import { AppOptions } from '..';
import { NpmFetcher } from '../../repository/ArchetypeFetcher/NpmFetcher';
import { ArchetypesRegistry } from '../../repository/ArchetypesRegistry';

/**
 * Parse parameters in format `key=value foo=bar bar="long string for one parameter"`
 */
const parseArchetypeParams = (params: string[]) => {
	const parsedParameters: Record<string, string> = {};
	for (const param of params) {
		const separator = param.match('=');

		// Skip params when can't find separator or separator index is 0 (hence key is empty)
		if (separator === null || separator.index === undefined || separator.index === 0)
			continue;

		const key = param.slice(0, separator.index);
		const value = param.slice(separator.index + 1);

		parsedParameters[key] = value;
	}

	return parsedParameters;
};

export class CommandArchetypes {
	protected options: AppOptions;
	constructor(options: AppOptions) {
		this.options = options;
	}

	public use: CliCommand = async (args: Record<string, any>) => {
		console.log("It's use command!", args);

		const { cacheDir } = this.options;

		// Get archetypes
		const archetypesRegistry = new ArchetypesRegistry();
		const archetypes = await archetypesRegistry.getArchetypes();

		// Find archetype
		const archetype = archetypes.find(({ name }) => name === args.archetype);
		if (!archetype) {
			throw new CriticalError(
				`Archetype "${args.archetype}" is not found. Check your config`,
			);
		}

		// Fetch archetype
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

		console.log({ archetypeDir });

		// Read and apply archetype
		const archetypeManifest = await getArchetypeManifest(archetypeDir);

		if (archetypeManifest === null) {
			throw new CriticalError('Archetype manifest is not found');
		}

		const { type: archetypeType } = archetypeManifest;
		const destination = path.resolve(process.cwd());

		if (archetypeType === ARCHETYPE_TYPE.STATIC_TEMPLATE) {
			const staticArchetype = new StaticTemplateArchetype();
			await staticArchetype.apply(archetypeDir, destination);
		} else if (archetypeType === ARCHETYPE_TYPE.HOOK) {
			const hookArchetype = new HookArchetype();
			await hookArchetype.apply({
				archetypeDir,
				destination,
				parameters: parseArchetypeParams(args.params),
			});
		} else {
			throw new CriticalError('Unknown type of archetype');
		}
	};
}

export const archetypeCommandsBuilder: CommandsBuilder = async (config) => {
	const use = new CommandArchetypes(config);

	// Ensure cache dir
	await mkdirp(config.cacheDir);

	return [
		{
			command: 'use',
			description: 'Apply archetype',
			handler: ({ parser }) => {
				parser.add_argument('archetype', { help: 'archetype name' });
				parser.add_argument('params', {
					nargs: '*',
					help: 'archetype parameters',
				});

				return use.use;
			},
		},
	];
};
