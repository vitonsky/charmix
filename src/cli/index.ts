import path from 'path';
import { exit } from 'process';

import { ArgumentParser } from 'argparse';
import { mkdirp } from 'fs-extra';

import { GitFetcher } from '../repository/ArchetypeFetcher/GitFetcher';

import { StaticTemplateArchetype } from '../archetype/StaticTemplateArchetype';
import { HookArchetype } from '../archetype/HookArchetype';
import { ArchetypeEntry, ARCHETYPE_TYPE } from '../archetype';
import { getArchetypeManifest } from '../archetype/utils';
import { CriticalError } from '../utils';

// TODO: replace `exit` with message to exceptions, catch it on top level and show messages
// it's necessary to abstract CLI logic of actions
export const app = async ({ cacheDir }: { cacheDir: string }) => {
	const { version } = require('../package.json');

	const gitFetcher = new GitFetcher(cacheDir);

	// TODO: implement repository to add/delete archetypes
	// Get archetypes
	let archetypes: ArchetypeEntry[] = [];
	try {
		const content = require('../archetypes.json');
		if (Array.isArray(content)) {
			archetypes = content;
		} else {
			throw new TypeError('Invalid format of archetypes.json');
		}
	} catch (err) {
		// TODO: add warning
	}

	const parser = new ArgumentParser({
		description: 'Generate project files structure from archetype',
	});

	parser.add_argument('archetype', { help: 'archetype name' });
	parser.add_argument('-v', '--version', { action: 'version', version });
	// parser.add_argument('-s', '--scripts', { help: 'define allow/disallow scripts' });

	const args = parser.parse_args();
	console.dir(args);

	const archetype = archetypes.find(({ name }) => name === args.archetype);
	if (!archetype) {
		console.log(`Archetype is not found. Check your config`);
		exit(1);
	}

	await mkdirp(cacheDir);

	let archetypeDir: string;
	switch (archetype.type) {
	// TODO: implement new types, at least `local`
	case 'git':
		archetypeDir = await gitFetcher.fetch(archetype.src);
		break;
	default:
		console.log('Unknown type of archetype');
		exit(1);
	}

	console.log({ archetypeDir });

	// TODO: run prepare script if allowed

	const destination = path.resolve(process.cwd());

	const archetypeManifest = await getArchetypeManifest(archetypeDir);

	if (archetypeManifest === null) {
		console.log('Archetype manifest is not found');
		exit(1);
	}

	const { type: archetypeType } = archetypeManifest;

	try {
		if (archetypeType === ARCHETYPE_TYPE.STATIC_TEMPLATE) {
			const staticArchetype = new StaticTemplateArchetype();
			await staticArchetype.apply(archetypeDir, destination);
		} else if (archetypeType === ARCHETYPE_TYPE.HOOK) {
			const staticArchetype = new HookArchetype();
			await staticArchetype.apply(archetypeDir, destination);
		} else {
			console.log('Unknown type of archetype');
			exit(1);
		}
	} catch (err) {
		if (err instanceof CriticalError) {
			console.error(err.message);

			if (err.cause) {
				throw err.cause;
			} else {
				exit(1);
			}
		} else {
			throw err;
		}
	}
};
