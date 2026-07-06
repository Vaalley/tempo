#!/usr/bin/env node
/**
 * md-to-pdf with embedded images (base64 data URIs)
 * Resolves all relative image paths from the markdown file's directory,
 * inlines them as base64, then renders to PDF via Puppeteer (headless Chrome).
 *
 * Usage: node scripts/md-to-pdf.mjs <input.md> [output.pdf]
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, extname, basename } from 'path';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const [, , inputArg, outputArg] = process.argv;
if (!inputArg) {
	console.error('Usage: node scripts/md-to-pdf.mjs <input.md> [output.pdf]');
	process.exit(1);
}

const inputPath = resolve(inputArg);
const inputDir = dirname(inputPath);
const outputPath = outputArg
	? resolve(outputArg)
	: resolve(inputDir, basename(inputPath, extname(inputPath)) + '.pdf');

if (!existsSync(inputPath)) {
	console.error(`File not found: ${inputPath}`);
	process.exit(1);
}

// --- 1. Read markdown and inline images as base64 data URIs ---
let md = readFileSync(inputPath, 'utf8');

const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
md = md.replace(imgRegex, (match, alt, src) => {
	// Skip already-inlined or remote images
	if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
		return match;
	}

	// Decode %20 etc.
	const decoded = decodeURIComponent(src);
	const absPath = resolve(inputDir, decoded);

	if (!existsSync(absPath)) {
		console.warn(`  [WARN] Image not found, skipping: ${absPath}`);
		return match;
	}

	const ext = extname(absPath).toLowerCase().replace('.', '');
	const mime =
		ext === 'jpg' || ext === 'jpeg'
			? 'image/jpeg'
			: ext === 'png'
				? 'image/png'
				: ext === 'gif'
					? 'image/gif'
					: ext === 'svg'
						? 'image/svg+xml'
						: ext === 'webp'
							? 'image/webp'
							: 'image/png';

	const data = readFileSync(absPath).toString('base64');
	console.log(
		`  [OK] Embedded ${basename(absPath)} (${((data.length * 0.75) / 1024).toFixed(0)} KB)`,
	);
	return `![${alt}](data:${mime};base64,${data})`;
});

// --- 2. Convert markdown to HTML ---
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    max-width: 960px;
    margin: 0 auto;
    padding: 20px 40px;
    color: #1a1a1a;
  }
  h1 { font-size: 2em; border-bottom: 2px solid #e1e4e8; padding-bottom: 0.3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #e1e4e8; padding-bottom: 0.2em; margin-top: 2em; }
  h3 { font-size: 1.25em; margin-top: 1.5em; }
  h4 { font-size: 1em; margin-top: 1.2em; }
  img { max-width: 100%; height: auto; display: block; margin: 1em auto; border: 1px solid #e1e4e8; border-radius: 4px; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 12px; }
  th, td { border: 1px solid #d1d5da; padding: 6px 12px; text-align: left; }
  th { background: #f6f8fa; font-weight: 600; }
  tr:nth-child(even) { background: #f9f9f9; }
  code { background: #f6f8fa; padding: 2px 5px; border-radius: 3px; font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; }
  pre { background: #f6f8fa; padding: 12px 16px; border-radius: 6px; overflow-x: auto; border: 1px solid #e1e4e8; }
  pre code { background: none; padding: 0; font-size: 11px; }
  blockquote { margin: 0; padding: 0 1em; color: #6a737d; border-left: 4px solid #dfe2e5; }
  hr { border: none; border-top: 1px solid #e1e4e8; margin: 2em 0; }
</style>
</head>
<body>
${marked.parse(md)}
</body>
</html>`;

// --- 3. Launch Puppeteer and print to PDF ---
console.log('Launching headless Chrome...');

const browser = await puppeteer.launch({
	args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });

await page.pdf({
	path: outputPath,
	format: 'A4',
	printBackground: true,
	margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
});

await browser.close();
console.log(`\nPDF saved: ${outputPath}`);
