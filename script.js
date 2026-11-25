(() => {
  'use strict';

  const secoes = [...document.querySelectorAll('.secao')];
  const links = [...document.querySelectorAll('[data-nav]')];
  const aviso = document.getElementById('aviso');
  const tituloBase = '#BoraReciclar | Escola Benjamin Constant';
  let temporizador;
  let primeiraVez = true;

  function avisar(texto, tipo = 'info') {
    aviso.textContent = texto;
    aviso.className = 'toast' + (tipo === 'erro' ? ' erro' : '');
    aviso.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { aviso.hidden = true; }, 5000);
  }

  function mostrarSecao() {
    const id = location.hash.slice(1);
    const alvo = secoes.find((s) => s.id === id) || secoes[0];
    secoes.forEach((s) => { s.hidden = s !== alvo; });
    links.forEach((a) => {
      if (a.getAttribute('href') === '#' + alvo.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const titulo = alvo.querySelector('h1, h2');
    document.title = (alvo.id === 'inicio' ? '' : titulo.textContent + ' | ') + tituloBase;
    window.scrollTo(0, 0);
    if (!primeiraVez) titulo.focus();
    primeiraVez = false;
  }

  window.addEventListener('hashchange', mostrarSecao);
  mostrarSecao();

  // Música: só toca depois do clique. O arquivo assets/audio/Musga.mp3 precisa existir.
  const musica = document.getElementById('musica');
  const botaoMusica = document.getElementById('botao-musica');
  botaoMusica.addEventListener('click', async () => {
    if (musica.paused) {
      try {
        await musica.play();
      } catch (erro) {
        avisar('Não foi possível tocar. Confira se o arquivo assets/audio/Musga.mp3 existe.', 'erro');
        return;
      }
    } else {
      musica.pause();
    }
    const tocando = !musica.paused;
    botaoMusica.setAttribute('aria-pressed', String(tocando));
    botaoMusica.textContent = tocando ? 'Pausar música' : 'Tocar música';
  });

  // Service worker: só em http(s). Se falhar, o site continua funcionando normalmente.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
