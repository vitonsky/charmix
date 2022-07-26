import path from 'path';

import { mkdirp } from 'fs-extra';

import { GitFetcher } from '../../repository/ArchetypeFetcher/GitFetcher';

import { StaticTemplateArchetype } from '../../archetype/StaticTemplateArchetype';
import { HookArchetype } from '../../archetype/HookArchetype';
import { ArchetypeEntry, ARCHETYPE_TYPE } from '../../archetype';
import { getArchetypeManifest } from '../../archetype/utils';
import { CriticalError } from '../../utils';

import { CliCommand } from './CliCommand';
import { AppOptions } from '..';

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

export class CommandUse {
	protected options: AppOptions;
	constructor(options: AppOptions) {
		this.options = options;
	}

	public use: CliCommand = async (args: Record<string, any>) => {
		console.log("It's use command!", args);

		const { cacheDir, rootDir } = this.options;
		const gitFetcher = new GitFetcher(cacheDir);

		// TODO: move to main class
		// Ensure cache dir
		await mkdirp(cacheDir);

		// Get archetypes
		let archetypes: ArchetypeEntry[] = [];
		try {
			const content = require(rootDir + '/archetypes.json');
			if (Array.isArray(content)) {
				archetypes = content;
			} else {
				throw new TypeError('Invalid format of archetypes.json');
			}
		} catch (err) {
			// TODO: add warning
		}

		const archetype = archetypes.find(({ name }) => name === args.archetype);
		if (!archetype) {
			throw new CriticalError(
				`Archetype "${args.archetype}" is not found. Check your config`,
			);
		}

		// TODO: implement new archetype fetchers, at least `local`
		let archetypeDir: string;
		switch (archetype.type) {
		case 'git':
			archetypeDir = await gitFetcher.fetch(archetype.src);
			break;
		default:
			throw new CriticalError('Unknown type of archetype');
		}

		console.log({ archetypeDir });

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
