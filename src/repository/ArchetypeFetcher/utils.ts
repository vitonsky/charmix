import { stat, pathExists, rm, mkdirp } from 'fs-extra';

export const prepareArchetypeDirectory = async (dirName: string) => {
	const isDirExist = await pathExists(dirName);

	// Remove directory
	if (isDirExist) {
		const dirStat = await stat(dirName);
		if (!dirStat.isDirectory()) {
			throw new Error(`Resource "${dirName}" is exists and it's not a directory`);
		}

		await rm(dirName, { recursive: true, force: true });
	}

	// Make new directory
	await mkdirp(dirName);
};
