// Bundles the standalone build into a single self-contained HTML file.
//   node standalone/build.mjs   ->   standalone/dist/perandori.html
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'dist');
mkdirSync(out, { recursive: true });

const bundle = await build({
  entryPoints: [join(here, 'main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2019'],
  write: false,
  legalComments: 'none',
});

const js = bundle.outputFiles[0].text;
const css = readFileSync(join(here, 'style.css'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#05070a">
<title>Perandori</title>
<meta name="description" content="Simulator karriere biznesi: vendime, rivalë, cikle ekonomike dhe nivele pa fund.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<script>
${js}
</script>
</body>
</html>
`;

const file = join(out, 'perandori.html');
writeFileSync(file, html);
console.log(`${file}  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);

// Second output for publishing as a claude.ai Artifact, whose host supplies the
// document skeleton: the page ships its own title, styles and script only.
const artifact = `<title>Perandori</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
${css}
</style>
<div id="app"></div>
<script>
${js}
</script>
`;
const afile = join(out, 'artifact.html');
writeFileSync(afile, artifact);
console.log(`${afile}  ${(Buffer.byteLength(artifact) / 1024).toFixed(1)} KB`);
