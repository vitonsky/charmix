import { ArchetypeReference } from '../../../archetype';
import { ArchetypeManager } from '../../../archetype/ArchetypeManager';
import { ArchetypesRegistry } from '../../../repository/ArchetypesRegistry';
import { CommandHandlerConstructor, CommandsBuilder } from '../CliCommand';

export const prepareArchetypeDelete: CommandHandlerConstructor<{
	registry: ArchetypesRegistry;
	archetypesManager: ArchetypeManager;
}> =
	({ registry, archetypesManager }) =>
		async (args: Record<string, any>) => {
			const { name } = args;

			const archetypes = await registry.getArchetypes();

			// Delete archetypes
			const newArray: ArchetypeReference[] = [];
			for (const archetype of archetypes) {
				if (archetype.name === name) {
					await archetypesManager.delete(archetype);
				} else {
					newArray.push(archetype);
				}
			}

			// Update archetypes references
			if (newArray.length !== archetypes.length) {
				await registry.setArchetypes(newArray);
			} else {
				console.log(`Archetype "${args.name}" is not found`);
			}
		};

export const buildArchetypeDelete: CommandsBuilder = async ({ cacheDir }) => [
	{
		command: 'delete',
		description: 'Delete archetype from registry',
		handler: ({ parser }) => {
			parser.add_argument('name');

			const registry = new ArchetypesRegistry();
			const archetypesManager = new ArchetypeManager({ cacheDir });
			return prepareArchetypeDelete({ registry, archetypesManager });
		},
	},
];
