import { ArgumentParser } from 'argparse';

import { AppOptions } from '..';

export type CliCommand = (args: Record<string, string>) => Promise<any>;

type CommandEntry = {
	command: string;
	description?: string;
	handler: (options: { parser: ArgumentParser }) => CliCommand;
};

export type CommandsBuilder = (config: AppOptions) => Promise<CommandEntry[]>;
