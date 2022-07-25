import path from 'path';
import crypto from 'crypto';

import clone from 'git-clone/promise';
import { isResourceExist, mkdir } from '../utils';

/**
 * Archetype fetcher to download archetype and return path to directory
 */
export interface ArchetypeFetcher {
	fetch(reference: string): Promise<string>;
}

export class GitFetcher implements ArchetypeFetcher {
	protected outDirectory: string;
	constructor(outDirectory: string) {
		this.outDirectory = outDirectory;
	}

	private getDirName = (src: string) => {
		try {
			const gitUrl = new URL(src);
			return path.join(this.outDirectory, gitUrl.hostname, gitUrl.pathname);
		} catch (error) {
			// Case when ref it's not URL, but path in a FS
			const dirName = crypto.createHash('sha512').update(src).digest('hex');
			return path.join(this.outDirectory, dirName);
		}
	};

	public fetch = async (src: string) => {
		const archetypeDir = this.getDirName(src);

		// Ensure getting files
		const isArchetypeDirExist = await isResourceExist(archetypeDir);
		if (!isArchetypeDirExist) {
			// Save repository to cache
			await mkdir(archetypeDir);
			await clone(src, archetypeDir, { shallow: true });
		}

		return archetypeDir;
	};
}
