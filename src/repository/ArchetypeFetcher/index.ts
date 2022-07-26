/**
 * Archetype fetcher to download archetype and return path to directory
 */
export interface ArchetypeFetcher {
	fetch(reference: string): Promise<string>;
}
