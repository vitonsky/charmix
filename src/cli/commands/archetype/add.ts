import { ArchetypesRegistry } from '../../../repository/ArchetypesRegistry';
import { CriticalError } from '../../../utils';
import { CommandHandlerConstructor, CommandsBuilder } from '../CliCommand';

export const prepareArchetypeAdd: CommandHandlerConstructor<{
	registry: ArchetypesRegistry;
}> =
	({ registry }) =>
		async (args: Record<string, any>) => {
			const { force = false, type, name, reference } = args;

			const archetypes = await registry.getArchetypes();

			// Find exists entries with same name and delete or exit program
			const filteredArchetypes = archetypes.filter((archetype) => {
				if (archetype.name !== name) return true;

				if (!force) {
					const message = `Archetype "${args.name}" already exist\n\nIf you want to replace, run with option -f`;
					throw new CriticalError(message);
				}

				return false;
			});

			// Add
			filteredArchetypes.push({ type: type as any, name, src: reference });
			await registry.setArchetypes(filteredArchetypes);
		};

export const buildArchetypeAdd: CommandsBuilder = async () => [
	{
		command: 'add',
		description: 'Add archetype to registry',
		handler: ({ parser }) => {
			parser.add_argument('--type', '-t', {
				required: true,
				help: 'archetype type',
				choices: ['git', 'local', 'npm'],
			});
			parser.add_argument('--force', '-f', {
				action: 'store_true',
				help: 'force add archetype. If archetype with same name already exists, it will be replaced',
			});
			parser.add_argument('name');
			parser.add_argument('reference');

			const registry = new ArchetypesRegistry();
			return prepareArchetypeAdd({ registry });
		},
	},
];
