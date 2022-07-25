import path from 'path';
import { exit } from 'process';

import { ArgumentParser } from 'argparse';
import { mkdirp } from 'fs-extra';

import { GitFetcher } from './repository/ArchetypeFetcher/GitFetcher';

import { StaticTemplateArchetype } from './archetype/StaticTemplateArchetype';
import { ArchetypeEntry, ARCHETYPE_TYPE } from './archetype';
import { getArchetypeType } from './archetype/utils';

const rootDir = path.resolve(path.dirname(__filename));
const cacheDir = path.join(rootDir, '.cache');

const gitFetcher = new GitFetcher(cacheDir);

// TODO: replace `exit` with message to exceptions, catch it on top level and show messages
// it's necessary to abstract CLI logic of actions
(async () => {
	const { version } = require('../package.json');

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
	const archetypeType = await getArchetypeType(archetypeDir);

	if (archetypeType === ARCHETYPE_TYPE.STATIC_TEMPLATE) {
		const staticArchetype = new StaticTemplateArchetype();
		staticArchetype.apply(archetypeDir, destination);
	} else {
		console.log('Unknown type of archetype');
		exit(1);
	}
})();
