import { ArchetypeManager } from '../../../archetype/ArchetypeManager';
import { ArchetypesRegistry } from '../../../repository/ArchetypesRegistry';
import { CommandHandlerConstructor, CommandsBuilder } from '../CliCommand';

export const prepareArchetypeUpdate: CommandHandlerConstructor<{
	registry: ArchetypesRegistry;
	archetypesManager: ArchetypeManager;
}> =
	({ registry, archetypesManager }) =>
		async () => {
			const archetypes = await registry.getArchetypes();
			for (const archetype of archetypes) {
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
		handler: () => {
			const registry = new ArchetypesRegistry();
			const archetypesManager = new ArchetypeManager({ cacheDir });
			return prepareArchetypeUpdate({ registry, archetypesManager });
		},
	},
];
