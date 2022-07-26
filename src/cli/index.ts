import { ArgumentParser } from 'argparse';

import { CriticalError } from '../utils';
import { CommandUse } from './commands/CommandUse';

export type AppOptions = {
	rootDir: string;
	cacheDir: string;
};

export const app = async (appOptions: AppOptions) => {
	const { version } = require('../package.json');

	const parser = new ArgumentParser({
		description: 'Generate project files structure from archetype',
	});

	const subParsers = parser.add_subparsers();
	parser.add_argument('-v', '--version', { action: 'version', version });

	// TODO: add builder to construct a parsers with no boilerplate
	// TODO: move params to the classes
	const use = new CommandUse(appOptions);
	const useParser = subParsers.add_parser('use');
	useParser.add_argument('archetype', { help: 'archetype name' });
	useParser.add_argument('params', { nargs: '*', help: 'archetype parameters' });
	useParser.set_defaults({ handler: use.use });
	// useParser.add_argument('-s', '--scripts', { help: 'define allow/disallow scripts' });

	// TODO: implement archetype managing (to add/delete archetypes)
	// const archetypeParser = subParsers.add_parser('archetype');
	// const archetypeSubParser = archetypeParser.add_subparsers();

	// const cmdArchetypes = new CommandArchetypes();
	// const addParser = archetypeSubParser.add_parser('add');
	// addParser.add_argument('type');
	// addParser.add_argument('name');
	// addParser.set_defaults({ handler: cmdArchetypes.add });

	// const delParser = archetypeSubParser.add_parser('delete');
	// delParser.add_argument('foo');
	// delParser.add_argument('bar');
	// delParser.add_argument('baz');
	// delParser.set_defaults({ handler: cmdArchetypes.delete });

	const args = parser.parse_args();

	console.dir(args);
	try {
		// Run command handler
		const { handler, ...otherArgs } = args;

		if (handler) {
			await handler(otherArgs);
		} else {
			parser.print_help();
		}
	} catch (err) {
		if (err instanceof CriticalError) {
			// Show message for user
			console.error(err.message);

			if (err.cause) {
				// Throw original error
				throw err.cause;
			} else {
				process.exit(1);
			}
		} else {
			throw err;
		}
	}
};
