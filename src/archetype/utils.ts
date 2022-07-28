import path from 'path';
import fs from 'fs/promises';

import * as iots from 'io-ts';

import { ArchetypeManifest } from '.';
import { isValidType } from '../validation';

export const ArchetypeStaticTemplateType = iots.type({
	type: iots.literal('staticTemplate'),
	files: iots.union([iots.string, iots.array(iots.string)]),
});

const OptionNameType = new iots.Type<string, string, unknown>(
	'string',
	(input: unknown): input is string =>
		typeof input === 'string' && input.match(/^[a-z0-9-_]+$/iu) !== null,
	// `iots.success` and `iots.failure` are helpers used to build `Either` instances
	(input, context) =>
		typeof input === 'string' && input.match(/^[a-z0-9-_]+$/iu) !== null
			? iots.success(input)
			: iots.failure(input, context),
	// `A` and `O` are the same, so `encode` is just the identity function
	iots.identity,
);

export const ArchetypeManifestOptionType = iots.intersection([
	iots.type({
		name: OptionNameType,
	}),
	iots.partial({
		required: iots.boolean,
		defaultValue: iots.union([iots.string, iots.number, iots.boolean, iots.null]),
		description: iots.string,
	}),
]);

export const ArchetypeConfigHookType = iots.intersection([
	iots.type({
		type: iots.literal('hook'),
		hook: iots.string,
	}),
	iots.partial({
		prepareCommand: iots.string,
		options: iots.array(ArchetypeManifestOptionType),
	}),
]);

export const ArchetypeManifestType = iots.intersection([
	iots.partial({
		name: iots.string,
		version: iots.string,
		description: iots.string,
		homepage: iots.string,
	}),

	iots.union([ArchetypeStaticTemplateType, ArchetypeConfigHookType]),
]);

export const getArchetypeManifest = async (dir: string) => {
	try {
		const metaFileName = 'archetype.json';

		const filename = path.join(dir, metaFileName);

		const fileBuffer = await fs.readFile(filename);
		const rawString = fileBuffer.toString('utf-8');
		const rawJson = JSON.parse(rawString);

		// TODO: use reporter and throw error to report a problem
		const manifestData: ArchetypeManifest | null = isValidType(
			ArchetypeManifestType,
			rawJson,
		)
			? rawJson
			: null;

		return manifestData;
	} catch {
		return null;
	}
};
