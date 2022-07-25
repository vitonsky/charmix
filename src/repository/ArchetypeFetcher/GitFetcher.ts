import path from 'path';
import crypto from 'crypto';

import { mkdirp } from 'fs-extra';
import clone from 'git-clone/promise';

import { ArchetypeFetcher } from '.';
import { isResourceExist } from '../../utils';

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
			await mkdirp(archetypeDir);
			await clone(src, archetypeDir, { shallow: true });
		}

		return archetypeDir;
	};
}
