import path from 'path';
import fs from 'fs/promises';

import * as iots from 'io-ts';

import { ArchetypeManifest } from '.';
import { isValidType } from '../validation';

export const ArchetypeStaticTemplateType = iots.type({
	type: iots.literal('staticTemplate'),
	files: iots.union([iots.string, iots.array(iots.string)]),
});

export const ArchetypeManifestOptionType = iots.intersection([
	iots.type({
		name: iots.string,
	}),
	iots.partial({
		required: iots.boolean,
		defaultValue: iots.string,
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
