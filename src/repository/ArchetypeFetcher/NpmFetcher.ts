import path from 'path';
import crypto from 'crypto';

import npmFetch from 'npm-registry-fetch';
import tar from 'tar';
import axios from 'axios';
import * as iots from 'io-ts';

import { ArchetypeFetcher } from '.';
import { CriticalError, isResourceExist } from '../../utils';
import { ensureDir } from 'fs-extra';
import { isRight } from 'fp-ts/lib/Either';

const isValidType = <T extends iots.Type<any, any, any>>(
	type: T,
	input: unknown,
): input is iots.TypeOf<T> => isRight(type.decode(input));

// package metadata API: https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
const responseSliceType = iots.type({
	versions: iots.record(
		iots.string,
		iots.record(
			iots.literal('dist'),
			iots.record(iots.literal('tarball'), iots.string),
		),
	),
});

/**
 * Fetch package from NPM-like registry
 */
export class NpmFetcher implements ArchetypeFetcher {
	protected outDirectory: string;
	constructor(outDirectory: string) {
		this.outDirectory = outDirectory;
	}

	private getDirName = (src: string) => {
		const dirName = crypto.createHash('sha512').update(src).digest('hex');
		return path.join(this.outDirectory, dirName);
	};

	public fetch = async (src: string) => {
		// registry API: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
		const packageJson: any = await npmFetch.json('/' + src);

		if (!isValidType(responseSliceType, packageJson)) {
			throw new CriticalError('Invalid response of NPM registry');
		}

		const sortedVersions = Object.keys(packageJson.versions).sort();
		const selectedVersion = sortedVersions[sortedVersions.length - 1];
		if (!selectedVersion) {
			throw new CriticalError('Version of package from NPM registry is not found');
		}

		const versionData = packageJson.versions[selectedVersion];
		const tarballUrl = versionData.dist.tarball;

		const archetypeDir = this.getDirName(tarballUrl);

		// Return cached directory
		const isArchetypeDirExist = await isResourceExist(archetypeDir);
		if (isArchetypeDirExist) {
			return archetypeDir;
		}

		// Ensure dir
		await ensureDir(archetypeDir);

		// Fetch data
		const tarballStream = await axios.get(tarballUrl, { responseType: 'stream' });
		await new Promise((res) => {
			// Unpack tarball to `cwd`
			tarballStream.data
				.pipe(
					tar.x({
						strip: 1,
						cwd: archetypeDir,
					}),
				)
				.on('end', res);
		});

		return archetypeDir;
	};
}
