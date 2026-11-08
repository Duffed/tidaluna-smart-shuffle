import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile('plugins/SmartShuffle/package.json', 'utf8'));
// Mirrors luna/buildPlugins' dynamic module lookup and package/hash convention.
// Avoids a GitHub dependency so the plugin can be built during a GitHub outage.
const result = await build({
  entryPoints: ['./plugins/SmartShuffle/src/index.ts'],
  outfile: 'dist/local.smart-shuffle.mjs', platform: 'browser', target: 'chrome126',
  format: 'esm', bundle: true, sourcemap: true, minify: true, write: false,
  banner: { js: '/*! Smart Shuffle for TidaLuna | Duffed | MS-PL | Source: https://github.com/Duffed/tidaluna-smart-shuffle */' },
  plugins: [{
    name: 'luna-runtime-modules',
    setup(builder) {
      builder.onResolve({ filter: /^(@luna\/.+|react|react\/jsx-runtime)$/ }, args => ({ path: args.path, namespace: 'luna-runtime' }));
      builder.onLoad({ filter: /.*/, namespace: 'luna-runtime' }, args => ({ contents: `
        module.exports = globalThis.luna?.core?.modules?.[${JSON.stringify(args.path)}];
        if (!module.exports) throw new Error('TidaLuna module unavailable: ' + ${JSON.stringify(args.path)});
        globalThis.luna.core.LunaPlugin.getByName(${JSON.stringify(args.path)})?.addDependant(
          globalThis.luna.core.LunaPlugin.getByName(${JSON.stringify(pkg.name)})
        );
      ` }));
    },
  }],
});
await mkdir('dist', { recursive: true });
for (const file of result.outputFiles) await writeFile(file.path, file.contents);
const output = result.outputFiles.find(file => file.path.endsWith('.mjs'));
await writeFile('dist/local.smart-shuffle.json', JSON.stringify({ ...pkg, hash: output.hash }, null, 2));
await writeFile('dist/store.json', JSON.stringify({
  name: 'Smart Shuffle', description: 'Smart Shuffle for TidaLuna',
  author: pkg.author, homepage: pkg.homepage,
  plugins: ['local.smart-shuffle.mjs'],
}, null, 2));
console.log(`Built dist/local.smart-shuffle.mjs (${output.contents.length} bytes, hash ${output.hash})`);
