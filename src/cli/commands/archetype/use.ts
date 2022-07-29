import path from 'path';
import { AppOptions } from '../..';
import { ARCHETYPE_TYPE } from '../../../archetype';
import { ArchetypeManager } from '../../../archetype/ArchetypeManager';
import { HookArchetype } from '../../../archetype/HookArchetype';
import { StaticTemplateArchetype } from '../../../archetype/StaticTemplateArchetype';
import { ArchetypesRegistry } from '../../../repository/ArchetypesRegistry';
import { CriticalError, nodePrompt } from '../../../utils';
import { CommandHandlerConstructor, CommandsBuilder } from '../CliCommand';

/**
 * Parse parameters in format `key=value foo=bar bar="long string for one parameter"`
 */
const parseArchetypeParams = (params: string[]) => {
	const parsedParameters: Record<string, string> = {};
	for (const param of params) {
		const separator = param.match('=');

		// Skip params when can't find separator or separator index is 0 (hence key is empty)
		if (separator === null || separator.index === undefined || separator.index === 0)
			continue;

		const key = param.slice(0, separator.index);
		const value = param.slice(separator.index + 1);

		parsedParameters[key] = value;
	}

	return parsedParameters;
};

// TODO: this method too long, refactor it
export const prepareArchetypeUse: CommandHandlerConstructor<{
	config: AppOptions;
}> =
	({ config }) =>
		async (args: Record<string, any>) => {
			console.log("It's use command!", args);

			const archetypeManager = new ArchetypeManager({ cacheDir: config.cacheDir });

			const { archetype: archetypeName, params, directory, interactive } = args;

			// Get archetypes
			const archetypesRegistry = new ArchetypesRegistry();
			const archetypes = await archetypesRegistry.getArchetypes();

			// Find archetype
			const archetype = archetypes.find(({ name }) => name === archetypeName);
			if (!archetype) {
				throw new CriticalError(
					`Archetype "${archetypeName}" is not found. Check your config`,
				);
			}

			// Fetch archetype
			const archetypeInfo = await archetypeManager.getArchetypeInfo(archetype);

			// Read and apply archetype
			const archetypeDir = archetypeInfo.directory;
			const { type: archetypeType } = archetypeInfo.manifest;

			const destination = path.resolve(process.cwd(), directory ?? '.');

			console.log({ archetypeDir });

			if (archetypeType === ARCHETYPE_TYPE.STATIC_TEMPLATE) {
				const staticArchetype = new StaticTemplateArchetype();
				await staticArchetype.apply(archetypeDir, destination);
			} else if (archetypeType === ARCHETYPE_TYPE.HOOK) {
				const parameters = parseArchetypeParams(params);

				// Enable interactive mode
				if (interactive) {
					const sortedOptions = (archetypeInfo.manifest.options ?? []).sort(
						(a, b) => Number(!a.required) - Number(!b.required),
					);

					console.log(`Configure archetype "${archetype.name}"`);

					let skipQuestions = false;
					let shouldSuggestToSkipOptional = true;
					for (const idx in sortedOptions) {
						const option = sortedOptions[idx];

						// Suggest to skip other questions after answer to all required questions
						if (shouldSuggestToSkipOptional && !option.required) {
						// Don't suggest if first option is not required
							if (Number(idx) === 0) {
								shouldSuggestToSkipOptional = false;
							} else {
							// Suggest to skip
								while (true) {
									const answer = await nodePrompt(
										`Do you want to skip ${
											sortedOptions.length - Number(idx)
										} not required options? [Y/n]: `,
									);

									const normalizedAnswer = (answer || '')
										.trim()
										.toLowerCase();
									if (['y', 'yes'].includes(normalizedAnswer)) {
										skipQuestions = true;
										break;
									} else if (['n', 'no'].includes(normalizedAnswer)) {
										break;
									}
								}

								shouldSuggestToSkipOptional = false;
							}
						}

						// Skip other questions
						if (skipQuestions) {
							break;
						}

						const step = `[${Number(idx) + 1}/${sortedOptions.length}]`;
						const description = option.description
							? ` - ${option.description}`
							: '';
						console.log(`\n${step} ${option.name}` + description);

						// Get answer
						while (true) {
							const currentValue =
							parameters[option.name] ?? option.defaultValue;
							const currentValueText =
							currentValue !== undefined
								? ` (current: ${currentValue})`
								: '';
							const answer = await nodePrompt(
								`${option.name}${currentValueText}: `,
							);
							if (answer || !option.required || currentValue !== undefined) {
							// Write answer
								if (answer) {
									parameters[option.name] = answer;
								}

								// Next question if option is not required or if got answer
								break;
							}
						}
					}
				}

				const requiredParams = (archetypeInfo.manifest.options ?? []).filter(
					({ name, required, defaultValue }) =>
						required && defaultValue === undefined && !(name in parameters),
				);

				if (requiredParams.length > 0) {
					const message =
					'Not specified required options:\n' +
					requiredParams
						.map(({ name, description }) => {
							const optionName = `- ${name}`;
							const descriptionPrefix = ': ';
							const indent = optionName.length + descriptionPrefix.length;
							return (
								optionName +
								(description
									? descriptionPrefix +
									  description.replace('\n', '\n' + ' '.repeat(indent))
									: '')
							);
						})
						.join('\n');
					throw new CriticalError(message);
				}

				const hookArchetype = new HookArchetype();
				await hookArchetype.apply({
					archetypeDir,
					destination,
					parameters,
				});
			} else {
				throw new CriticalError('Unknown type of archetype');
			}
		};

export const buildArchetypeUse: CommandsBuilder = async (config) => [
	{
		command: 'use',
		description: 'Apply selected archetype',
		handler: ({ parser }) => {
			parser.add_argument('--directory', '-d', {
				help: 'apply archetype to specified directory instead of current working directory',
			});

			parser.add_argument('--interactive', '-i', {
				action: 'store_true',
				help: 'enable interactive mode',
			});
			// TODO: implement
			// parser.add_argument('--clear', {
			// 	action: 'store_true',
			// 	help: 'remove ALL files and directories in target directory before apply archetype',
			// });
			parser.add_argument('archetype', { help: 'archetype name' });
			parser.add_argument('params', {
				nargs: '*',
				help: 'archetype parameters',
			});

			return prepareArchetypeUse({ config });
		},
	},
];
