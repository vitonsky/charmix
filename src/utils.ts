import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { spawn, SpawnOptions } from 'child_process';

/**
 * Error to throw and show message to user
 */
export class CriticalError extends Error {
	public cause: Error | null = null;
	constructor(
		msg: string,
		options?: {
			/**
			 * This error should be thrown after catch `CriticalError`
			 */
			cause?: Error;
		},
	) {
		super(msg);
		this.cause = options?.cause ?? null;
	}
}

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

export const nodePrompt = (text: string) =>
	new Promise<string>((res) => {
		const readlineInstance = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		readlineInstance.question(text, (response: string) => {
			readlineInstance.close();
			res(response);
		});
	});

/**
 * Return sub path and ensure that its path is not out of parent directory, otherwise throw error
 */
export const getSubPath = (pathname: string, subPath: string) => {
	const resolvedPath = path.resolve(pathname, subPath);

	if (!resolvedPath.startsWith(path.resolve(pathname))) {
		throw new Error(`Path is out of parent directory`);
	}

	return resolvedPath;
};
