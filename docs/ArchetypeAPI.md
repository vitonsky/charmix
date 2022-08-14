Archetype it is directory contains file `archetype.json` with declarative description of archetype.

# Archetype manifest

Archetype manifest is a file `archetype.json` contains information about archetype.

- **type**: define type of archetype and additional properties. This property is required for any archetype
- name: name that will used to apply archetype
- version: archetype version
- homepage: url to archetype repository or docs
- description: description about archetype that may contains instructions

# Types of archetype

## Static

Static archetype is most simple project template, it's just specify files and directories to copy to the target directory.

`archetype.json`

```json
{
	"type": "staticTemplate",
	// glob paths to files and directories that will copy to the target directory
	// it may be string or array of strings or object with properties `include` and `exclude` contains string or array of strings
	"files": {
		"include": ["files/*"],
		"exclude": ["files/foo"]
	}
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
	"hook": "./hook.js",
	// variables to configure files
	"options": [
		{
			// option name
			"name": "name",
			// charmix ensure that required options will be specified by user
			"required": true,
			// description about property purpose
			"description": "Project name"
		},
		{
			"name": "useReact",
			// default value will provided if user will not specify option
			// when specified both `defaultValue` and `required`, user may leave default value
			"defaultValue": false,
			"description": "Include react and its linters to dependencies"
		}
	]
}
```

Hook function receive 2 parameters:

- properties
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

You may create archetype from template:

- Install `charmix add -t git https://github.com/vitonsky/charmix.git archetypes/archetype`
- Create archetype hook template `charmix use archetype name=myArchetypeName`
