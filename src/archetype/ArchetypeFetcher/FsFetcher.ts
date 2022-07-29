import path from 'path';
import crypto from 'crypto';

import { copy, stat } from 'fs-extra';

import { ArchetypeFetcher } from '.';
import { prepareArchetypeDirectory } from './utils';
import { CriticalError, isResourceExist } from '../../utils';

export class FsFetcher implements ArchetypeFetcher {
	protected outDirectory: string;
	constructor(outDirectory: string) {
		this.outDirectory = outDirectory;
	}

	private getDirName = (src: string) => {
		const dirName = crypto.createHash('sha512').update(src).digest('hex');
		return path.join(this.outDirectory, dirName);
	};

	public fetch = async (src: string) => {
		const srcStat = await stat(src);
		if (!srcStat.isDirectory()) {
			throw new CriticalError(`Resource "${src}" is not directory`);
		}

		const archetypeDir = this.getDirName(src);

		// Ensure getting files
		const isArchetypeDirExist = await isResourceExist(archetypeDir);
		if (!isArchetypeDirExist) {
			// Save repository to cache
			await prepareArchetypeDirectory(archetypeDir);
			await copy(src, archetypeDir);
		}

		return archetypeDir;
	};
}
