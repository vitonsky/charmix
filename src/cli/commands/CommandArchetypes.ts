import { CliCommand } from './CliCommand';

export class CommandArchetypes {
	public add: CliCommand = async (args: Record<string, string>) => {
		console.log('> CommandArchetypes.add', args);
	};
	public delete: CliCommand = async (args: Record<string, string>) => {
		console.log('> CommandArchetypes.delete', args);
	};
}
