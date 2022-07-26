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

- options dictionary
- object provided hooks

Function may return nothing or array of files.

Function signature

```ts
type File = {
	path: string;
	contents: Buffer;
};

type ProvidedControls = {
	addFile: (file: File) => void;
};

type Hook = (
	parameters: Record<string, string>,
	controls: ProvidedControls,
) => Promise<void | File[]>;
```

To add files to the target directory, hook function may return array of files or register files by call `addFile` hook.

File must be object with 2 properties:

- path: `string` with relative path to the file
- contents: `Buffer` contains content of the file
