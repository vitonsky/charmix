Archetype it is directory contains file `archetype.json` with declarative description of archetype.

# Structure of `archetype.json`

- type: define type of archetype and additional properties

# Types of archetype

## Static

Static archetype is most simple project template, it's just specify files and directories to copy to the target directory.

`archetype.json`

```json
{
	"type": "staticTemplate",
	// glob paths to files and directories that will copy to the target directory
	// it may be string or array of strings
	"files": "files/*"
}
```

## Hook

Hook archetype it's javascript module that export function that receive parameters and generate files to the target directory.

It's very powerful tool to flexible configuration of template files.

`archetype.json`

```json
{
	"type": "hook",
	// command that will execute before run hook
	// it useful to prepare hook to work, for example
	// to install dependencies or compile TS files to JS files
	"prepareCommand": "npm i",
	// javascript module that export hook
	"hook": "./hook.js"
}
```

Hook function receive 2 parameters:

- options
- object provided hooks

Function may return nothing or array of files.

### Function signature

```ts
type File = {
	path: string;
	contents: Buffer;
};

export type HookControls = {
	addFile: (file: File) => void;
};

export type HookOptions = {
	/**
	 * Path to archetype directory
	 */
	archetypePath: string;

	/**
	 * Path to target directory to apply hook
	 */
	targetPath: string;

	/**
	 * Options provided by user to configure data
	 */
	options: Record<any, any>;
};

/**
 * Object that a hook module return
 */
export type HookModule = {
	getFiles: (properties: HookOptions, controls: HookControls) => Promise<void | File[]>;
};
```

### How to implement hook

Hook will receive `options` provided by user, hook may use this options to configure project templates.

To add files to the target directory, hook function may return array of files or register files by call `addFile` hook.

File must be object with 2 properties:

- path: `string` with relative path to the file
- contents: `Buffer` contains content of the file

Hook also may just copy files to a directory from `targetPath`, it's useful feature to easy wrap other CLI application, however you should prefer use declarative way to write files described above when it possible, to user have control over this files with configuration features.
