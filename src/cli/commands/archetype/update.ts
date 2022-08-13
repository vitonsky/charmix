import { ArchetypeManager } from '../../../archetype/ArchetypeManager';
import { ArchetypesRegistry } from '../../../repository/ArchetypesRegistry';
import { CommandHandlerConstructor, CommandsBuilder } from '../CliCommand';

export const prepareArchetypeUpdate: CommandHandlerConstructor<{
	registry: ArchetypesRegistry;
	archetypesManager: ArchetypeManager;
}> =
	({ registry, archetypesManager }) =>
		async (args) => {
			const archetypes = await registry.getArchetypes();

			// Warn about not found archetypes and stop process
			const selectedArchetypes = args.names as unknown as string[];
			if (selectedArchetypes.length > 0) {
				const notFoundArchetypes = selectedArchetypes.filter(
					(name) =>
						archetypes.findIndex((archetype) => archetype.name === name) === -1,
				);

				if (notFoundArchetypes.length > 0) {
					notFoundArchetypes.forEach((name) => {
						console.error(`Error: archetype "${name}" not found`);
					});

					process.exit(1);
				}
			}

			for (const archetype of archetypes) {
			// Skip not specified archetypes by name
				if (
					selectedArchetypes.length > 0 &&
				!selectedArchetypes.includes(archetype.name)
				)
					continue;

				try {
					console.log(`Fetch archetype "${archetype.name}" ...`);
					const temporaryArchetype =
					await archetypesManager.fetchArchetypeToTempDirectory(archetype);

					console.log(`Update archetype "${archetype.name}" ...`);
					await archetypesManager.delete(archetype);
					archetypesManager.install(archetype, temporaryArchetype.path);
				} catch (error) {
					if (error instanceof Error) {
						console.error('Error: ' + error.message);
					}
				}
			}
		};

export const buildArchetypeUpdate: CommandsBuilder = async ({ cacheDir }) => [
	{
		command: 'update',
		description: 'Update archetypes',
		handler: ({ parser }) => {
			parser.add_argument('names', {
				nargs: '*',
				help: 'archetype names to update',
			});

			const registry = new ArchetypesRegistry();
			const archetypesManager = new ArchetypeManager({ cacheDir });
			return prepareArchetypeUpdate({ registry, archetypesManager });
		},
	},
];
