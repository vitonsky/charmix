import path from 'path';
import fs from 'fs/promises';

import { ArchetypeManifest } from '.';

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
