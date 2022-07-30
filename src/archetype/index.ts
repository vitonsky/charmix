export type ArchetypeReference = {
	name: string;
	type: 'git' | 'local' | 'npm';
	src: string;
};

export type ArchetypeStaticTemplate = {
	type: 'staticTemplate';
	files: string | string[];
};

export type ArchetypeManifestOption = {
	name: string;
	required?: boolean;
	defaultValue?: string;
	description?: string;
};

export type ArchetypeConfigHook = {
	type: 'hook';
	hook: string;
	prepareCommand?: string;
	options?: ArchetypeManifestOption[];
};

export type ArchetypeCli = {
	type: 'cli';
	command: string;
};

export type ArchetypeManifest = {
	name?: string;
	version?: string;
	description?: string;
	homepage?: string;
} & (ArchetypeStaticTemplate | ArchetypeConfigHook | ArchetypeCli);

export enum ARCHETYPE_TYPE {
	STATIC_TEMPLATE = 'staticTemplate',
	HOOK = 'hook',
}
