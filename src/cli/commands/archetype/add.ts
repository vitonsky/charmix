import { AppOptions } from '../..';
import { ArchetypeReference } from '../../../archetype';
import { ArchetypeManager } from '../../../archetype/ArchetypeManager';
import { ArchetypesRegistry } from '../../../repository/ArchetypesRegistry';
import { CriticalError } from '../../../utils';
import { CommandHandlerConstructor, CommandsBuilder } from '../CliCommand';

export const prepareArchetypeAdd: CommandHandlerConstructor<{
	config: AppOptions;
	registry: ArchetypesRegistry;
}> =
	({ config, registry }) =>
		async (args: Record<string, any>) => {
			const { force = false, type, name, reference } = args;

			const archetypeManager = new ArchetypeManager({ cacheDir: config.cacheDir });
			const archetypes = await registry.getArchetypes();

			// Exit if archetype already exists
			const uniqueNameCheck = (name: string) => {
				if (!force) {
					const foundArchetype = archetypes.find(
						(archetype) => archetype.name === name,
					);
					if (foundArchetype !== undefined) {
						const message = `Archetype "${name}" already exist\n\nIf you want to replace, run with option -f`;
						throw new CriticalError(message);
					}
				}
			};

			// check user provided name
			uniqueNameCheck(name);

			// Install
			console.log('Fetch archetype...');
			const temporaryArchetype = await archetypeManager.fetchArchetypeToTempDirectory({
				type,
				src: reference,
			});

			// validations
			// TODO: add name validation
			const archetypeName = name ?? temporaryArchetype.manifest.name;
			if (typeof archetypeName !== 'string') {
				throw new CriticalError(
					'Not found name in archetype manifest. Set name manually to successful install',
				);
			}

			// check name from archetype manifest
			uniqueNameCheck(archetypeName);

			const archetypeRef: ArchetypeReference = {
				name: archetypeName,
				type,
				src: reference,
			};

			console.log('Install archetype...');
			// delete if exists
			await archetypeManager.delete(archetypeRef);

			// install from temporary directory
			archetypeManager.install(archetypeRef, temporaryArchetype.path);

			// Add to registry
			const newArchetypesList = archetypes
				.filter((archetype) => archetype.name !== archetypeName)
				.concat(archetypeRef);

			await registry.setArchetypes(newArchetypesList);
		};

export const buildArchetypeAdd: CommandsBuilder = async (config) => [
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
			parser.add_argument('--name', '-n');
			parser.add_argument('reference');

			const registry = new ArchetypesRegistry();
			return prepareArchetypeAdd({ config, registry });
		},
	},
];
