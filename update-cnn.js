const fs = require('fs');
const https = require('https');
const path = require('path');

async function fetchCNN() {
  return new Promise((resolve, reject) => {
    https.get('https://www.cnnbrasil.com.br/ao-vivo/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html = await fetchCNN();
    // A CNN às vezes usa video-title-video e depois o ID real. Vamos buscar o primeiro ID de 11 caracteres que não seja "title-video"
    const matches = [...html.matchAll(/video-([A-Za-z0-9_-]{11})/g)];
    let videoId = null;
    for (const match of matches) {
      if (match[1] !== 'title-video') {
        videoId = match[1];
        break;
      }
    }
    
    if (!videoId) {
      console.log('Nenhum vídeo ao vivo válido encontrado na página da CNN.');
      process.exit(0);
    }
    console.log('Vídeo ao vivo identificado:', videoId);
    
    const indexPath = path.join(__dirname, 'index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    
    // Substituir o cartão atual pelo iframe incorporado
    const iframeHtml = `<div class="cnn-frame"><iframe title="CNN Brasil ao vivo" src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
    
    if (indexHtml.includes(iframeHtml)) {
      console.log('O vídeo já está atualizado no index.html.');
      process.exit(0);
    }
    
    // Se já tiver um iframe, substitui. Se tiver o cartão, substitui o cartão.
    if (indexHtml.includes('cnn-frame')) {
      indexHtml = indexHtml.replace(/<div class="cnn-frame">.*?<\/iframe><\/div>/, iframeHtml);
    } else {
      indexHtml = indexHtml.replace(/<a class="cnn-live-card".*?<\/a><p class="cnn-note">.*?<\/p>/, iframeHtml);
    }
    
    fs.writeFileSync(indexPath, indexHtml);
    console.log('index.html atualizado com o novo vídeo incorporado.');
  } catch (err) {
    console.error('Erro ao atualizar CNN:', err);
    process.exit(1);
  }
}

run();
