import { ensureDir, readFile, writeFile } from 'fs-extra';
import { homedir } from 'os';
import path from 'path';
import { isResourceExist } from '../utils';

import * as iots from 'io-ts';
import { isValidType } from '../validation';

export const ArchetypeEntryType = iots.type({
	name: iots.string,
	src: iots.string,
	type: iots.union([iots.literal('git'), iots.literal('local'), iots.literal('npm')]),
});

export const ArchetypeEntriesType = iots.array(ArchetypeEntryType);

// TODO: implement safe concurrent read/write
export class ArchetypesRegistry {
	// protected readonly registryVersion = 1;
	protected readonly registryDir = path.join(homedir(), '.charmix');
	protected readonly archetypesFile = path.join(this.registryDir, 'archetypes.json');

	protected sync = async () => {
		await ensureDir(this.registryDir);

		const isArchetypesFileExists = await isResourceExist(this.archetypesFile);
		if (!isArchetypesFileExists) {
			writeFile(this.archetypesFile, '[]');
		}
	};

	public getArchetypes = async () => {
		await this.sync();

		const buffer = await readFile(this.archetypesFile);
		const rawString = buffer.toString('utf8');
		const rawJson = JSON.parse(rawString);

		return isValidType(ArchetypeEntriesType, rawJson) ? rawJson : [];
	};

	public setArchetypes = async (
		archetypes: iots.TypeOf<typeof ArchetypeEntriesType>,
	) => {
		await this.sync();

		const serializedData = JSON.stringify(archetypes, null, '\t');
		await writeFile(this.archetypesFile, serializedData);
	};
}
