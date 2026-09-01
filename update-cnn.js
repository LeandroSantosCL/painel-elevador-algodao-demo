const fs = require('fs');
const https = require('https');
const path = require('path');

const FALLBACK_ID = '4elw325Z3Fg';

function fetchCNN() {
  return new Promise((resolve, reject) => {
    const request = https.get('https://www.cnnbrasil.com.br/ao-vivo/', {
      headers: { 'user-agent': 'painel-elevador-algodao-cnn-resolver/1.0' },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) reject(new Error(`CNN Brasil respondeu ${res.statusCode}`));
        else resolve(data);
      });
    });
    request.on('error', reject);
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

function extractCandidateIds(html) {
  const patterns = [
    /video-([A-Za-z0-9_-]{11})/g,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/g,
    /youtu\.be\/([A-Za-z0-9_-]{11})/g,
  ];
  const ids = [];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) ids.push(match[1]);
  }
  return [...new Set(ids)].filter(id => !id.startsWith('title-'));
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
  if (!official || !live || !embeddable) throw new Error(`candidato ${videoId} rejeitado: oficial=${official} live=${live} incorporável=${embeddable}`);
  return { validated: true, channelTitle: item.snippet.channelTitle };
}

async function findVideoId(html) {
  const candidates = extractCandidateIds(html);
  if (!process.env.YOUTUBE_API_KEY) return { videoId: FALLBACK_ID, validation: { validated: false, reason: 'missing-api-key' }, candidates };
  const failures = [];
  for (const videoId of candidates.slice(0, 20)) {
    try {
      return { videoId, validation: await validateOfficialVideo(videoId), candidates };
    } catch (error) {
      failures.push(error.message);
    }
  }
  throw new Error(`Nenhum candidato da CNN passou na validação oficial. ${failures.slice(0, 5).join(' | ')}`);
}

async function run() {
  try {
    const html = await fetchCNN();
    const result = await findVideoId(html);
    console.log('Vídeo ao vivo identificado:', result.videoId, result.validation.validated ? '(validado pela API)' : '(fallback sem chave)');
    console.log('Candidatos analisados:', result.candidates.length);

    const indexPath = path.join(__dirname, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    fs.writeFileSync(indexPath, replaceCNN(indexHtml, result.videoId));
    console.log('index.html atualizado com iframe CNN e fallback oficial.');
  } catch (err) {
    console.error('Erro ao atualizar CNN:', err);
    process.exit(1);
  }
}

module.exports = { buildFrame, replaceCNN, extractCandidateIds, validateOfficialVideo, findVideoId };
if (require.main === module) run();
