import path from 'path';

import { ArgumentParser } from 'argparse';

import { CriticalError } from '../utils';
import { archetypeCommandsBuilder } from './commands/CommandUse';
import { CommandsBuilder } from './commands/CliCommand';

export type AppOptions = {
	rootDir: string;
	cacheDir: string;
};

export const app = async (appOptions: AppOptions) => {
	const { version } = require(path.join(appOptions.rootDir, 'package.json'));

	const parser = new ArgumentParser({
		description: 'Generate project files structure from archetype',
	});

	const subParsers = parser.add_subparsers();

	// Define main commands
	parser.add_argument('-v', '--version', { action: 'version', version });

	// Register commands
	const commandBuilders: CommandsBuilder[] = [archetypeCommandsBuilder];
	commandBuilders.forEach((builder) => {
		const commands = builder(appOptions);
		for (const command of commands) {
			const parser = subParsers.add_parser(command.command, {
				description: command.description,
			});
			const commandHandler = command.handler({ parser });
			parser.set_defaults({ handler: commandHandler });
		}
	});

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
