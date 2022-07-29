import { AppOptions } from '../..';
import { ArchetypeManager } from '../../../archetype/ArchetypeManager';
import { ArchetypesRegistry } from '../../../repository/ArchetypesRegistry';
import { CriticalError } from '../../../utils';
import { CommandHandlerConstructor, CommandsBuilder } from '../CliCommand';

export const prepareArchetypeList: CommandHandlerConstructor<{
	config: AppOptions;
	registry: ArchetypesRegistry;
}> =
	({ config, registry }) =>
		async (args: Record<string, any>) => {
			const { archetype } = args;

			const archetypeManager = new ArchetypeManager({ cacheDir: config.cacheDir });

			const archetypes = await registry.getArchetypes();
			if (archetype) {
			// Show archetype help
				const archetypeReference = archetypes.find(({ name }) => name === archetype);
				if (!archetypeReference) {
					throw new CriticalError(`Archetype "${args.name}" not found`);
				}

				const { manifest } = await archetypeManager.getArchetypeInfo(
					archetypeReference,
				);

				console.log(`Archetype: ${archetypeReference.name}\n`);

				if (manifest.name) {
					console.log(`Original name: ${manifest.name}`);
				}
				if (manifest.version) {
					console.log(`Version: ${manifest.version}`);
				}
				if (manifest.type) {
					console.log(`Type: ${manifest.type}`);
				}

				// TODO: show files list to copy for `staticTemplate` type
				if (manifest.type === 'hook') {
					if (manifest.prepareCommand) {
						console.log(`Command to prepare: ${manifest.prepareCommand}`);
					}

					// Hook info
					const options = (manifest.options ?? []).sort(
						(a, b) => Number(!a.required) - Number(!b.required),
					);
					if (options.length > 0) {
						console.log(`\nOptions:`);
						const formattedOptions = options
							.map(({ name, description, required, defaultValue }) => {
								const marker = required ? '-' : '*';
								const indent = '    ';

								let message = `${marker} ${name}`;

								if (defaultValue !== undefined) {
									message += ` [default: ${defaultValue}]`;
								}
								if (description) {
									message += `\n${indent}${description.replace(
										'\n',
										'\n' + indent,
									)}`;
								}

								return message;
							})
							.join('\n');

						console.log(formattedOptions);
					}
				}

				if (manifest.description) {
					console.log(`\nDescription:\n${manifest.description}`);
				}

				if (manifest.homepage) {
					console.log(`\nHome page: ${manifest.homepage}`);
				}
			} else {
			// List archetypes
				console.log(archetypes.map(({ name }) => '- ' + name).join('\n'));
			}
		};

export const buildArchetypeList: CommandsBuilder = async (config) => [
	{
		command: 'list',
		description: 'List available archetypes',
		handler: ({ parser }) => {
			parser.add_argument('-a', '--archetype', {
				help: 'show archetype description and options',
			});

			const registry = new ArchetypesRegistry();
			return prepareArchetypeList({ config, registry });
		},
	},
];
