const fs = require('fs');
const https = require('https');
const path = require('path');

const FALLBACK_ID = '4elw325Z3Fg';

function fetchCNN() {
  return new Promise((resolve, reject) => {
    https.get('https://www.cnnbrasil.com.br/ao-vivo/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function buildFrame(videoId) {
  return `<div class="cnn-frame"><iframe title="CNN Brasil ao vivo" src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&origin=https%3A%2F%2Fleandrosantoscl.github.io" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div><a class="cnn-link" href="https://www.cnnbrasil.com.br/ao-vivo/" target="_blank" rel="noopener noreferrer">Abrir player oficial da CNN ↗</a>`;
}

async function run() {
  try {
    const html = await fetchCNN();
    const matches = [...html.matchAll(/video-([A-Za-z0-9_-]{11})/g)];
    const videoId = matches.find(match => match[1] !== 'title-video')?.[1] || FALLBACK_ID;
    console.log('Vídeo ao vivo identificado:', videoId);

    const indexPath = path.join(__dirname, 'index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    const iframeHtml = buildFrame(videoId);
    const oldCard = /<a class="cnn-live-card"[\s\S]*?<\/a><p class="cnn-note">[\s\S]*?<\/p>/;
    const existingFrame = /<div class="cnn-frame">[\s\S]*?<\/div>(?:<a class="cnn-link"[\s\S]*?<\/a>)?/;

    if (oldCard.test(indexHtml)) indexHtml = indexHtml.replace(oldCard, iframeHtml);
    else if (existingFrame.test(indexHtml)) indexHtml = indexHtml.replace(existingFrame, iframeHtml);
    else throw new Error('Não foi encontrado o cartão ou iframe da CNN no index.html.');

    fs.writeFileSync(indexPath, indexHtml);
    console.log('index.html atualizado com iframe CNN e fallback oficial.');
  } catch (err) {
    console.error('Erro ao atualizar CNN:', err);
    process.exit(1);
  }
}

run();
