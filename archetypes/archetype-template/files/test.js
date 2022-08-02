const { getFiles } = require('./hook');
const { mkdirpSync, writeFile } = require('fs-extra');
const { cwd } = require('process');
const path = require('path');
const { rmSync } = require('fs');

const outDir = path.join(cwd(), 'out');

rmSync(outDir, { force: true, recursive: true });
mkdirpSync(outDir);

const awaitsPool = [];
const addFile = (file) => {
	const filename = path.join(outDir, file.path);
	mkdirpSync(path.dirname(filename));
	awaitsPool.push(writeFile(path.join(outDir, file.path), file.contents));
};

/**
 * Archetype options for test
 */
const archetypeOptions = {};

getFiles({ options: archetypeOptions }, { addFile }).then(async (files) => {
	(files ?? []).forEach((file) => addFile(file));
	await Promise.all(awaitsPool);
});
