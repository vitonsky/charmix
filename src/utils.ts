import fs from 'fs/promises';

export const isResourceExist = (filename: string) =>
	fs.access(filename).then(
		() => true,
		() => false,
	);
