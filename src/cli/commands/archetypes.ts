import path from 'path';

import { mkdirp } from 'fs-extra';

import { ArchetypeFetcher } from '../../repository/ArchetypeFetcher';
import { FsFetcher } from '../../repository/ArchetypeFetcher/FsFetcher';
import { GitFetcher } from '../../repository/ArchetypeFetcher/GitFetcher';

import { StaticTemplateArchetype } from '../../archetype/StaticTemplateArchetype';
import { HookArchetype } from '../../archetype/HookArchetype';
import { ArchetypeEntry, ARCHETYPE_TYPE } from '../../archetype';
import { getArchetypeManifest } from '../../archetype/utils';
import { CriticalError, nodePrompt } from '../../utils';

import { CliCommand, CommandsBuilder } from './CliCommand';
import { AppOptions } from '..';
import { NpmFetcher } from '../../repository/ArchetypeFetcher/NpmFetcher';
import { ArchetypesRegistry } from '../../repository/ArchetypesRegistry';

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

// TODO: split this class
export class CommandArchetypes {
	protected options: AppOptions;
	protected registry: ArchetypesRegistry;
	constructor(options: AppOptions, registry: ArchetypesRegistry) {
		this.options = options;
		this.registry = registry;
	}

	public list: CliCommand = async (args) => {
		const { archetype } = args;

		const archetypes = await this.registry.getArchetypes();
		if (archetype) {
			// Show archetype help
			const archetypeReference = archetypes.find(({ name }) => name === archetype);
			if (!archetypeReference) {
				throw new CriticalError(`Archetype "${args.name}" not found`);
			}

			const { manifest } = await this.getArchetypeInfo(archetypeReference);

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

	public add: CliCommand = async (args) => {
		const { force = false, type, name, reference } = args;

		const archetypes = await this.registry.getArchetypes();

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
		await this.registry.setArchetypes(filteredArchetypes);
	};

	public delete: CliCommand = async (args) => {
		const { name } = args;

		const archetypes = await this.registry.getArchetypes();
		const newArray = archetypes.filter((archetype) => archetype.name !== name);

		if (newArray.length !== archetypes.length) {
			await this.registry.setArchetypes(newArray);
		} else {
			console.log(`Archetype "${args.name}" is not found`);
		}
	};

	private fetchArchetype = async (archetype: ArchetypeEntry) => {
		const { cacheDir } = this.options;

		const fetchers: Record<ArchetypeEntry['type'], ArchetypeFetcher> = {
			git: new GitFetcher(cacheDir),
			local: new FsFetcher(cacheDir),
			npm: new NpmFetcher(cacheDir),
		};

		let archetypeDir: string;
		if (archetype.type in fetchers) {
			const fetcher = fetchers[archetype.type];
			archetypeDir = await fetcher.fetch(archetype.src);
		} else {
			throw new CriticalError('Unknown type of archetype');
		}

		return archetypeDir;
	};

	private getArchetypeInfo = async (archetype: ArchetypeEntry) => {
		const directory = await this.fetchArchetype(archetype);

		const manifest = await getArchetypeManifest(directory);
		if (manifest === null) {
			throw new CriticalError(
				`Manifest of archetype "${archetype.name}" is not found`,
			);
		}

		return { directory, manifest };
	};

	// TODO: this method too long, refactor it
	public use: CliCommand = async (args: Record<string, any>) => {
		console.log("It's use command!", args);

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
		const archetypeInfo = await this.getArchetypeInfo(archetype);

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
				({ name, required }) => required && !(name in parameters),
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
}

export const archetypeCommandsBuilder: CommandsBuilder = async (config) => {
	const registry = new ArchetypesRegistry();
	const archetypes = new CommandArchetypes(config, registry);

	// Ensure cache dir
	await mkdirp(config.cacheDir);

	return [
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

				return archetypes.use;
			},
		},
		{
			command: 'list',
			description: 'List available archetypes',
			handler: ({ parser }) => {
				parser.add_argument('-a', '--archetype', {
					help: 'show archetype description and options',
				});

				return archetypes.list;
			},
		},
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

				return archetypes.add;
			},
		},
		{
			command: 'delete',
			description: 'Delete archetype from registry',
			handler: ({ parser }) => {
				parser.add_argument('name');

				return archetypes.delete;
			},
		},
	];
};
