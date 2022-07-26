import { spawn, SpawnOptions } from 'child_process';
import fs from 'fs/promises';

/**
 * Error to throw and show message to user
 */
export class CriticalError extends Error {}

export const isResourceExist = (filename: string) =>
	fs.access(filename).then(
		() => true,
		() => false,
	);

export const executeCommand = async (command: string, options: SpawnOptions) =>
	new Promise<number>((res) => {
		const prepareScript = spawn(command, [], { ...(options as any), shell: true });

		prepareScript.stdout.on('data', (chunk) => {
			console.log(chunk.toString());
		});

		prepareScript.stderr.on('data', (chunk) => {
			console.error(chunk.toString());
		});

		prepareScript.on('close', (code) => {
			res(code || 0);
		});
	});
