export type ArchetypeEntry = {
	name: string;
	type: 'git' | 'local' | 'npm';
	src: string;
};

export type ArchetypeStaticTemplate = {
	type: 'staticTemplate';
	files: string | string[];
};

export type ArchetypeConfigHook = {
	type: 'hook';
	hook: string;
	prepareCommand?: string;
};

export type ArchetypeCli = {
	type: 'cli';
	command: string;
};

export type ArchetypeManifest = {
	name?: string;
	version?: string;
} & (ArchetypeStaticTemplate | ArchetypeConfigHook | ArchetypeCli);

export enum ARCHETYPE_TYPE {
	STATIC_TEMPLATE = 'staticTemplate',
	HOOK = 'hook',
}
