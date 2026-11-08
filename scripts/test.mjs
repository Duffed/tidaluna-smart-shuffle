import { build } from 'esbuild';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'smart-shuffle-tests-'));
try {
  const tests = (await readdir('tests')).filter(file => file.endsWith('.test.ts'));
  await build({
    entryPoints: tests.map(file => `./tests/${file}`), outdir: directory,
    bundle: true, platform: 'node', format: 'esm', target: 'node22', outExtension: { '.js': '.mjs' },
    packages: 'external',
    plugins: [{ name: 'mock-luna', setup(builder) {
      builder.onResolve({ filter: /^@luna\/lib$/ }, () => ({ path: 'lib', namespace: 'mock-luna' }));
      builder.onLoad({ filter: /.*/, namespace: 'mock-luna' }, () => ({ contents: `
        export const redux = globalThis.__smartShuffleTestLib.redux;
        export const PlayState = globalThis.__smartShuffleTestLib.PlayState;
        export const TidalApi = globalThis.__smartShuffleTestLib.TidalApi;
      ` }));
    } }],
  });
  const result = spawnSync(process.execPath, ['--test', ...tests.map(file => join(directory, file.replace(/\.ts$/, '.mjs')))], { stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  const target = resolve(directory);
  if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('smart-shuffle-tests-'))
    throw new Error('Unexpected test temporary directory');
  await rm(target, { recursive: true, force: true });
}
