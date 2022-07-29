import path from 'path';

import { ArgumentParser } from 'argparse';

import { CriticalError } from '../utils';
import { CommandsBuilder } from './commands/CliCommand';

// Commands
import { buildArchetypeAdd } from './commands/archetype/add';
import { buildArchetypeDelete } from './commands/archetype/delete';
import { buildArchetypeList } from './commands/archetype/list';
import { buildArchetypeUse } from './commands/archetype/use';

export type AppOptions = {
	rootDir: string;
	cacheDir: string;
};

export const COMMAND_NAME = 'charmix';

export const app = async (appOptions: AppOptions) => {
	const { version } = require(path.join(appOptions.rootDir, 'package.json'));

	const parser = new ArgumentParser({
		prog: COMMAND_NAME,
		description: 'Generate project files structure from archetype',
	});

	const subParsers = parser.add_subparsers();

	// Define main commands
	parser.add_argument('-v', '--version', { action: 'version', version });

	// Register commands
	const commandBuilders: CommandsBuilder[] = [
		buildArchetypeAdd,
		buildArchetypeDelete,
		buildArchetypeList,
		buildArchetypeUse,
	];

	for (const builder of commandBuilders) {
		const commands = await builder(appOptions);
		for (const command of commands) {
			const parser = subParsers.add_parser(command.command, {
				description: command.description,
			});
			const commandHandler = command.handler({ parser });
			parser.set_defaults({ handler: commandHandler });
		}
	}

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
