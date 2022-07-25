import path from 'path';
import fs from 'fs/promises';

import { ArchetypeManifest, ARCHETYPE_TYPE } from '.';
import { isResourceExist } from '../utils';

export const getArchetypeManifest = async (dir: string) => {
	try {
		const metaFileName = 'archetype.json';

		const filename = path.join(dir, metaFileName);

		const fileBuffer = await fs.readFile(filename);
		const rawData = fileBuffer.toString('utf-8');

		// TODO: add validation
		return JSON.parse(rawData) as ArchetypeManifest;
	} catch {
		return null;
	}
};

export const getArchetypeType = async (
	archetypeDir: string,
): Promise<ARCHETYPE_TYPE | null> => {
	const filesDir = path.join(archetypeDir, 'files');
	const isFilesDirExist = await isResourceExist(filesDir);
	if (isFilesDirExist) {
		return ARCHETYPE_TYPE.STATIC_TEMPLATE;
	}

	return null;
};
