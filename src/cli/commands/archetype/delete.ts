import { ArchetypesRegistry } from '../../../repository/ArchetypesRegistry';
import { CommandHandlerConstructor, CommandsBuilder } from '../CliCommand';

export const prepareArchetypeDelete: CommandHandlerConstructor<{
	registry: ArchetypesRegistry;
}> =
	({ registry }) =>
		async (args: Record<string, any>) => {
			const { name } = args;

			const archetypes = await registry.getArchetypes();
			const newArray = archetypes.filter((archetype) => archetype.name !== name);

			if (newArray.length !== archetypes.length) {
				await registry.setArchetypes(newArray);
			} else {
				console.log(`Archetype "${args.name}" is not found`);
			}
		};

export const buildArchetypeDelete: CommandsBuilder = async () => [
	{
		command: 'delete',
		description: 'Delete archetype from registry',
		handler: ({ parser }) => {
			parser.add_argument('name');

			const registry = new ArchetypesRegistry();
			return prepareArchetypeDelete({ registry });
		},
	},
];
