export type ArchetypeEntry = {
	name: string;
	type: 'git';
	src: string;
};

export type ArchetypeStaticTemplate = {
	type: 'staticTemplate';
	files: string | string[];
};

export type ArchetypeConfigHook = {
	type: 'hook';
	hook: string;
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
