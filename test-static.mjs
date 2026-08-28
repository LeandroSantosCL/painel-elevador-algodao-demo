import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { replaceCNN } = require('./update-cnn.js');
const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

const oldCard = '<a class="cnn-live-card" href="https://www.cnnbrasil.com.br/ao-vivo/" target="_blank" rel="noopener noreferrer"><span>TRANSMISSÃO OFICIAL</span></a><p class="cnn-note">fallback</p>';
const migrated = replaceCNN(oldCard, 'ABCDEFGHIJK');
assert.match(migrated, /youtube\.com\/embed\/ABCDEFGHIJK/);
assert.doesNotMatch(migrated, /cnn-live-card/);

const iframe = replaceCNN(migrated, '12345678901');
assert.match(iframe, /youtube\.com\/embed\/12345678901/);
assert.equal((iframe.match(/cnn-frame/g) || []).length, 1);

assert.match(html, /class="cnn-frame"/);
assert.match(html, /title="CNN Brasil ao vivo"/);
assert.match(html, /id="ibov"/);
assert.match(html, /id="weather"/);
assert.match(html, /id="clock"/);
assert.match(html, /id="destinations"/);
assert.match(html, /id="ptax-track"/);
assert.match(html, /id="ptax-alerts"/);
assert.match(html, /story-qr/);
assert.match(html, /create-qr-code/);
assert.match(html, /height:100dvh/);
assert.match(html, /overflow:hidden/);
assert.match(html, /overflow-y:auto/);
assert.doesNotMatch(html, /\.story h2\{[^}]*line-clamp/);
assert.match(html, /\.vertical main\{grid-template-columns:1fr/);
assert.match(html, /grid-template-columns:minmax\(0,1\.56fr\) minmax\(360px,\.94fr\)/);
assert.match(html, /\.vertical \.side\{grid-template-columns:1fr 1fr/);
assert.match(html, /PANEL_REFRESH_MS=60\*60\*1000/);
assert.match(html, /class="market-strip"/);
assert.doesNotMatch(html, /class="market-card"/);
assert.equal((html.match(/id="ibov"/g) || []).length, 1);
assert.match(html, /market-strip-track/);
assert.ok((html.match(/animation:market-scroll 96s linear infinite/g) || []).length >= 2);
assert.match(html, /story\.story-swap/);
assert.match(html, /root\.classList\.add\('story-swap'\)/);
assert.match(html, /rel="preconnect" href="https:\/\/abrapa\.com\.br"/);
assert.match(html, /iframe loading="lazy"/);
assert.match(html, /img loading="lazy" decoding="async" width="48" height="48"/);
assert.match(html, /size=96x96/);
assert.match(html, /NEWS_ROTATION_MS=96000/);
assert.match(html, /scheduleNewsRotation\(\)/);
assert.match(html, /scheduleDataRefresh\(\)/);
assert.match(html, /state\.refreshing/);
assert.doesNotMatch(html, /location\.reload\(/);
assert.doesNotMatch(html, /setInterval\(\(\)=>\{if\(state\.playing/);
assert.match(html, /summary-distance/);
assert.match(html, /summaryScroll 120s/);

console.log('OK: testes estáticos CNN, QR, compactação e regras de tempo passaram.');
