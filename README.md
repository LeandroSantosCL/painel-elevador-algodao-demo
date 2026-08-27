# Painel de Elevador — demonstração estática

Este repositório contém uma única página estática, sem backend ou credenciais, pronta para publicação no GitHub Pages.

O endereço principal apresenta o painel em formato horizontal. Para o modo de display vertical 9:16, acrescente `?layout=vertical` ao final da URL publicada.

As fontes públicas são consultadas diretamente pelo navegador quando liberam acesso entre origens. Caso uma fonte esteja indisponível, o painel preserva o estado inicial de demonstração para não deixar a tela vazia.

As cotações PTAX exibem um indicador visual de volatilidade por comparação entre dois boletins de fechamento consecutivos. Variações de 0,50% a 0,99% são classificadas como atenção e variações de 1,00% ou mais como críticas. O indicador é exclusivamente informativo.

## Transmissão CNN ao vivo

O painel tenta incorporar o vídeo ao vivo identificado na página oficial da [CNN Brasil](https://www.cnnbrasil.com.br/ao-vivo/) usando um iframe do YouTube. O workflow `Update CNN Live Video` roda a cada 15 minutos e atualiza o ID do vídeo. Para habilitar a validação adicional pela YouTube Data API — canal contendo “CNN Brasil”, transmissão com `liveBroadcastContent=live` e `status.embeddable=true` — cadastre `YOUTUBE_API_KEY` como secret do repositório GitHub. Sem essa chave, o workflow registra explicitamente que usou o fallback conhecido e mantém o link para o player oficial.

A presença do iframe é verificável no HTML publicado, mas a reprodução efetiva depende das políticas vigentes do YouTube, da disponibilidade do stream, de autoplay permitido e da conectividade do navegador/tela. Por isso o painel mantém o link “Abrir player oficial da CNN” como fallback visível no código e não promete reprodução quando a plataforma bloqueia incorporação.

## Testes estáticos

Execute `node test-static.mjs` na raiz deste repositório para verificar a migração do cartão para iframe, a atualização idempotente, o QR code, os módulos essenciais e as regras de compactação dos modos horizontal e `?layout=vertical`.

## Ciclos automáticos do painel

A notícia em destaque alterna automaticamente a cada 96 segundos por um agendamento reiniciável; o resumo usa rolagem suave de 120 segundos e reinicia quando outra notícia é selecionada. O clima de Santos e o relógio digital BRT são atualizados no carregamento e o relógio avança a cada segundo. Caso o navegador bloqueie uma fonte pública, os módulos exibem estado de indisponibilidade em vez de deixar a tela vazia.

## Atualização horária em segundo plano

A versão estática agenda uma nova consulta a cada hora (`60 minutos`) usando um temporizador encadeado no navegador. A rotina atualiza notícias, clima e demais fontes diretamente no DOM, preservando a página aberta, o relógio, a notícia selecionada e os controles de reprodução. O rodapé informa o resultado e o horário da última sincronização. O botão de atualização manual usa a mesma rotina e impede consultas sobrepostas.
