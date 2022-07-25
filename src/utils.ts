const fx = require('mkdir-recursive');

import fs from 'fs/promises';

export const mkdir = (path: string) =>
	new Promise<void>((res, rej) => {
		fx.mkdir(path, (err: any) => {
			if (err) {
				rej(err);
			} else {
				res();
			}
		});
	});

export const isResourceExist = (filename: string) =>
	fs.access(filename).then(
		() => true,
		() => false,
	);
