// iniciar após carregar o html
document.addEventListener('DOMContentLoaded', () => {
  // seleciona elementos principais
  const nav       = document.getElementById('navbar');
  const logo      = document.getElementById('logo');
  const toggle    = document.getElementById('menu-toggle');
  const links     = document.querySelectorAll('.menu a');
  const input     = document.getElementById('search-input');
  const btn       = document.getElementById('search-button');
  const prevBtn   = document.getElementById('prev-button');
  const nextBtn   = document.getElementById('next-button');
  const countSpan = document.getElementById('result-count');

  // variáveis de estado
  let navTimer     = null;  // controla fechamento automático
  let results      = [];    // armazena spans com matches
  let currentIndex = 0;     // índice atual de destaque
  let clearTimer   = null;  // timeout para limpar destaque
  let lastTerm     = '';    // última busca realizada

  // guarda html original de cada seção para resetar depois
  const originalHTML = {};
  document.querySelectorAll('main section').forEach(sec => {
    originalHTML[sec.id] = sec.innerHTML;
  });

  // função para restaurar as seções ao estado original
  function resetSections() {
    document.querySelectorAll('main section').forEach(sec => {
      sec.innerHTML = originalHTML[sec.id];
    });
  }

  // limpa destaques e resultados
  function clearAllHighlights() {
    resetSections();
    results = [];
    currentIndex = 0;
    [prevBtn, nextBtn, countSpan].forEach(el => el.style.display = 'none');
  }

  // habilita/desabilita busca conforme nav esteja expandido
  function updateSearchAvail() {
    const open = nav.classList.contains('expanded');
    input.disabled = btn.disabled = !open;
    if (!open) {
      input.value = '';
      clearAllHighlights();
    }
  }

  // expande navbar e libera busca
  function expandNav() {
    clearTimeout(navTimer);
    nav.classList.add('expanded');
    updateSearchAvail();
  }
  // fecha navbar depois de um tempo
  function closeNav() {
    nav.classList.remove('expanded');
    updateSearchAvail();
  }

  // abre nav ao passar mouse
  nav.addEventListener('mouseenter', expandNav);
  // inicia timer para fechar nav ao sair
  nav.addEventListener('mouseleave', () => {
    if (document.activeElement !== input) {
      navTimer = setTimeout(closeNav, 2500);
    }
  });

  // impede fechamento enquanto digita
  input.addEventListener('focus', () => clearTimeout(navTimer));
  input.addEventListener('blur', () => {
    if (!nav.matches(':hover')) {
      navTimer = setTimeout(closeNav, 2500);
    }
  });

  // toggle manual via botão
  toggle.addEventListener('click', () =>
    nav.classList.contains('expanded') ? closeNav() : expandNav()
  );

  // clique no logo rola pra início se aberto
  logo.addEventListener('click', e => {
    if (!nav.classList.contains('expanded')) e.preventDefault();
    else document.getElementById('inicio').scrollIntoView({ behavior: 'smooth' });
  });

  // links do menu rolam e fecham nav
  links.forEach(a => {
    a.addEventListener('click', e => {
      if (!nav.classList.contains('expanded')) {
        e.preventDefault();
      } else {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        closeNav();
      }
    });
  });

  // envolve cada ocorrência do termo em um span
  function wrapMatches(term) {
    // escapa chars especiais e cria regex global e case-insensitive
    const regex = new RegExp(term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    document.querySelectorAll('main section').forEach(sec => {
      (function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          let last = 0, m, found = false;
          const frag = document.createDocumentFragment();

          regex.lastIndex = 0;
          // para cada match, cria span com classe e guarda em results
          while ((m = regex.exec(text)) !== null) {
            found = true;
            frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            const span = document.createElement('span');
            span.className = 'search-result';
            span.textContent = m[0];
            frag.appendChild(span);
            results.push(span);
            last = m.index + m[0].length;
          }
          if (found) {
            frag.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode.replaceChild(frag, node);
          }
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          !['SCRIPT','STYLE'].includes(node.tagName) &&
          !node.classList.contains('search-result')
        ) {
          // percorre filhos recursivamente
          Array.from(node.childNodes).forEach(traverse);
        }
      })(sec);
    });
  }

  // atualiza botões e contador
  function updateUI() {
    if (results.length) {
      [prevBtn, nextBtn, countSpan].forEach(el => el.style.display = 'inline-block');
      countSpan.textContent = `${currentIndex + 1} de ${results.length}`;
    } else {
      [prevBtn, nextBtn, countSpan].forEach(el => el.style.display = 'none');
    }
  }

  // destaca o resultado de índice i e centraliza na tela
  function highlightAt(i) {
    results.forEach(s => s.classList.remove('highlight'));
    currentIndex = (i + results.length) % results.length;
    const sp = results[currentIndex];
    sp.classList.add('highlight');
    sp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateUI();
    clearTimeout(clearTimer);
    // limpa destaque após 3s
    clearTimer = setTimeout(() => sp.classList.remove('highlight'), 3000);
  }

  // realiza busca: destaca novo termo ou vai pro próximo
  function doSearch() {
    const term = input.value.trim();
    if (!term || !nav.classList.contains('expanded')) return;

    if (term === lastTerm && results.length) {
      highlightAt(currentIndex + 1);
      return;
    }

    lastTerm = term;
    clearAllHighlights();
    clearTimeout(clearTimer);

    wrapMatches(term);
    if (results.length) highlightAt(0);
    else alert(`nenhuma correspondência pra "${term}"`);
  }

  // eventos de busca e navegação de resultados
  btn.addEventListener('click', () => {
    doSearch();
    input.focus();
    clearTimeout(navTimer);
    navTimer = setTimeout(closeNav, 2500);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });
  prevBtn.addEventListener('click', () => {
    if (results.length) highlightAt(currentIndex - 1);
    input.focus();
  });
  nextBtn.addEventListener('click', () => {
    if (results.length) highlightAt(currentIndex + 1);
    input.focus();
  });

  // inicializa estado de busca
  updateSearchAvail();
  clearAllHighlights();
});
