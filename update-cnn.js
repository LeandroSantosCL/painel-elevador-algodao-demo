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

function replaceCNN(indexHtml, videoId) {
  const iframeHtml = buildFrame(videoId);
  const oldCard = /<a class="cnn-live-card"[\s\S]*?<\/a><p class="cnn-note">[\s\S]*?<\/p>/;
  const existingFrame = /<div class="cnn-frame">[\s\S]*?<\/div>(?:<a class="cnn-link"[\s\S]*?<\/a>)?/;
  if (oldCard.test(indexHtml)) return indexHtml.replace(oldCard, iframeHtml);
  if (existingFrame.test(indexHtml)) return indexHtml.replace(existingFrame, iframeHtml);
  throw new Error('Não foi encontrado o cartão ou iframe da CNN no index.html.');
}

async function validateOfficialVideo(videoId) {
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY ausente; validação oficial da API não executada.');
    return { validated: false, reason: 'missing-api-key' };
  }
  const endpoint = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,status&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`YouTube Data API respondeu ${response.status}`);
  const item = (await response.json()).items?.[0];
  const official = item?.snippet?.channelTitle?.toLowerCase().includes('cnn brasil');
  const live = item?.snippet?.liveBroadcastContent === 'live';
  const embeddable = item?.status?.embeddable === true;
  if (!official || !live || !embeddable) throw new Error('Vídeo encontrado não passou na validação de canal oficial, live ou incorporação.');
  return { validated: true, channelTitle: item.snippet.channelTitle };
}

async function run() {
  try {
    const html = await fetchCNN();
    const matches = [...html.matchAll(/video-([A-Za-z0-9_-]{11})/g)];
    const videoId = matches.find(match => match[1] !== 'title-video')?.[1] || FALLBACK_ID;
    const validation = await validateOfficialVideo(videoId);
    console.log('Vídeo ao vivo identificado:', videoId, validation.validated ? '(validado pela API)' : '(fallback sem chave)');

    const indexPath = path.join(__dirname, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    fs.writeFileSync(indexPath, replaceCNN(indexHtml, videoId));
    console.log('index.html atualizado com iframe CNN e fallback oficial.');
  } catch (err) {
    console.error('Erro ao atualizar CNN:', err);
    process.exit(1);
  }
}

module.exports = { buildFrame, replaceCNN, validateOfficialVideo };
if (require.main === module) run();
