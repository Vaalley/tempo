#!/usr/bin/env bun
/**
 * Export all PlantUML diagrams to PNG
 * Usage: bun run scripts/export-diagrams.ts
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const DIAGRAMS_DIR = './diagrams';
const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml/png';
const PLANTUML_SVG_SERVER = 'https://www.plantuml.com/plantuml/svg';

// PlantUML encoding alphabet
const ENCODE_6BIT = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

/**
 * Encode a single 6-bit value to PlantUML character
 */
function encode6bit(b: number): string {
	if (b < 10) return String.fromCharCode(48 + b); // 0-9
	if (b < 36) return String.fromCharCode(55 + b); // A-Z (65-10)
	if (b < 62) return String.fromCharCode(61 + b); // a-z (97-36)
	if (b === 62) return '-';
	if (b === 63) return '_';
	return '?';
}

/**
 * Encode bytes to PlantUML format
 */
function encode64(data: Uint8Array): string {
	let result = '';
	for (let i = 0; i < data.length; i += 3) {
		const b1 = data[i];
		const b2 = data[i + 1] ?? 0;
		const b3 = data[i + 2] ?? 0;

		const c1 = b1 >> 2;
		const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
		const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
		const c4 = b3 & 0x3f;

		result += encode6bit(c1) + encode6bit(c2);
		if (i + 1 < data.length) result += encode6bit(c3);
		if (i + 2 < data.length) result += encode6bit(c4);
	}
	return result;
}

/**
 * Deflate and encode PlantUML text
 * Note: Uses HUFFMAN encoding (~1 prefix) as Bun's CompressionStream uses deflate with huffman
 */
async function encodePlantUML(text: string): Promise<string> {
	const compressed = await deflate(text);
	// ~1 prefix indicates HUFFMAN encoding (Bun's CompressionStream uses this)
	return '~1' + encode64(compressed);
}

/**
 * Deflate using CompressionStream
 */
async function deflate(text: string): Promise<Uint8Array> {
	const stream = new Blob([text]).stream();
	const compressed = stream.pipeThrough(new CompressionStream('deflate'));
	const reader = compressed.getReader();

	const chunks: Uint8Array[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}

	// Combine chunks
	const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
}

/**
 * Export a single diagram to PNG
 */
async function exportDiagram(txtPath: string): Promise<void> {
	const content = await Bun.file(txtPath).text();
	const encoded = await encodePlantUML(content);
	const url = `${PLANTUML_SERVER}/${encoded}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch PNG for ${txtPath}: ${response.status}`);
	}

	const pngPath = txtPath.replace('.txt', '.png');
	const buffer = await response.arrayBuffer();
	await Bun.write(pngPath, new Uint8Array(buffer));

	const name = txtPath.split('/').pop() ?? txtPath;
	console.log(`  \u2713 ${name} -> ${pngPath.split('/').pop()}`);
}

/**
 * Main export function
 */
async function main(): Promise<void> {
	console.log('\ud83d\udcca Exporting PlantUML diagrams to PNG...\n');

	try {
		const entries = await readdir(DIAGRAMS_DIR);
		const diagramFiles = entries
			.filter((f) => f.endsWith('.txt'))
			.map((f) => join(DIAGRAMS_DIR, f));

		if (diagramFiles.length === 0) {
			console.log('No .txt diagram files found in', DIAGRAMS_DIR);
			process.exit(0);
		}

		console.log(`Found ${diagramFiles.length} diagram(s):\n`);

		let success = 0;
		let failed = 0;

		for (const file of diagramFiles) {
			try {
				await exportDiagram(file);
				success++;
			} catch (error) {
				const name = file.split('/').pop() ?? file;
				console.error(
					`  \u2717 ${name}: ${error instanceof Error ? error.message : error}`,
				);
				failed++;
			}
		}

		console.log(`\n\u2705 Done! ${success} exported, ${failed} failed`);

		if (failed > 0) {
			process.exit(1);
		}
	} catch (error) {
		console.error('Error reading diagrams directory:', error);
		process.exit(1);
	}
}

main();
