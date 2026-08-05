/* ==========================================================================
   ADEGA DA NATY — Controle de Vale e Pagamentos (app.js)
   Sem backend. Estado em memória + LocalStorage. Sem dependências externas.
   ========================================================================== */
(() => {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIGURAÇÃO
     ------------------------------------------------------------------ */
  const CHAVE = "adega_naty_folha_v1";      // chave do LocalStorage

  // Meses do período (Junho/2026 → Dezembro/2026)
  const MESES = [
    { id: "2026-06", nome: "Junho",    ano: 2026 },
    { id: "2026-07", nome: "Julho",    ano: 2026 },
    { id: "2026-08", nome: "Agosto",   ano: 2026 },
    { id: "2026-09", nome: "Setembro", ano: 2026 },
    { id: "2026-10", nome: "Outubro",  ano: 2026 },
    { id: "2026-11", nome: "Novembro", ano: 2026 },
    { id: "2026-12", nome: "Dezembro", ano: 2026 },
  ];

  // Estrutura padrão de um mês
  const mesVazio = (m) => ({
    salario: "",           // salário base daquele mês (herda do funcionário se vazio)
    valeData: "",   valeValor: "",
    adiantData: "", adiantValor: "",
    pagData: "",    pagValor: "",
    obs: "",
    aberto: false,
  });

  // Estado inicial
  const estadoPadrao = () => ({
    funcionario: { nome: "", cargo: "", salarioBase: "" },
    meses: Object.fromEntries(MESES.map((m) => [m.id, mesVazio(m)])),
  });

  /* ------------------------------------------------------------------
     UTILITÁRIOS
     ------------------------------------------------------------------ */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // Converte texto em número aceitando formatos "1.500,50" (BR) e "1500.5" (ponto decimal).
  // Regra: se houver vírgula, ela é o separador decimal e pontos são milhar.
  //        se houver só ponto, ele é o separador decimal.
  const num = (v) => {
    let s = String(v ?? "").trim();
    if (!s) return 0;
    if (s.includes(",")) {
      s = s.replace(/\./g, "").replace(",", ".");   // BR: remove milhar, vírgula->ponto
    }
    // sem vírgula: mantém o ponto como decimal (não mexe)
    const n = parseFloat(s.replace(/[^\d.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  // "1234.5" -> "R$ 1.234,50"  |  vazio -> "R$ 0,00"
  const moeda = (v) => num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // data ISO (yyyy-mm-dd) -> dd/mm/aaaa
  const dataBR = (iso) => {
    if (!iso) return "—";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
  };

  const escapeHTML = (s) =>
    String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------------------------------------------------------
     PERSISTÊNCIA (LocalStorage)
     ------------------------------------------------------------------ */
  let estado = carregar();

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return estadoPadrao();
      const dados = JSON.parse(bruto);
      // mescla com o padrão (garante todos os meses mesmo se a estrutura mudar)
      const base = estadoPadrao();
      base.funcionario = { ...base.funcionario, ...(dados.funcionario || {}) };
      for (const m of MESES) {
        base.meses[m.id] = { ...base.meses[m.id], ...((dados.meses || {})[m.id] || {}) };
      }
      return base;
    } catch {
      return estadoPadrao();
    }
  }

  function salvar(silencioso = false) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
      if (!silencioso) toast("Dados salvos neste dispositivo ✓");
      return true;
    } catch {
      if (!silencioso) toast("Não foi possível salvar 😕", true);
      return false;
    }
  }

  /* ------------------------------------------------------------------
     CÁLCULOS
     ------------------------------------------------------------------ */
  // salário efetivo do mês (usa o do mês, senão o salário base do funcionário)
  const salarioDoMes = (mes) =>
    num(mes.salario) || num(estado.funcionario.salarioBase);

  // Recebido no mês = vale + adiantamento + pagamento
  const recebidoMes = (mes) =>
    num(mes.valeValor) + num(mes.adiantValor) + num(mes.pagValor);

  // Saldo a pagar = salário - (vale + adiantamento + pagamento)
  const saldoMes = (mes) => salarioDoMes(mes) - recebidoMes(mes);

  function totaisGerais() {
    let salario = 0, vale = 0, adiant = 0, pago = 0, recebido = 0, saldo = 0;
    for (const m of MESES) {
      const mes = estado.meses[m.id];
      salario  += salarioDoMes(mes);
      vale     += num(mes.valeValor);
      adiant   += num(mes.adiantValor);
      pago     += num(mes.pagValor);
      recebido += recebidoMes(mes);
      saldo    += saldoMes(mes);
    }
    return { salario, vale, adiant, pago, recebido, saldo };
  }

  /* ------------------------------------------------------------------
     ÍCONES (SVG inline)
     ------------------------------------------------------------------ */
  const ic = {
    user:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
    badge:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M9 2h6v3H9zM8 12h8M8 16h5"/></svg>',
    money:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
    cal:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
    vale:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18v10H3zM3 11h18"/><circle cx="7" cy="14" r="1"/></svg>',
    adiant: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v13m0 0l-4-4m4 4l4-4M4 21h16"/></svg>',
    pag:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    note:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/></svg>',
    chevron:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    wallet: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/><circle cx="17" cy="13" r="1.3"/></svg>',
    check:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    coins:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  };

  /* ------------------------------------------------------------------
     RENDER — campo de input reutilizável
     ------------------------------------------------------------------ */
  function campo({ label, icone, tipo = "text", valor = "", chave, moeda = false, placeholder = "" }) {
    const labelHTML = `<label>${icone ? icone : ""}${label}</label>`;
    if (moeda) {
      return `
        <div class="campo campo--moeda">
          ${labelHTML}
          <span class="rs">R$</span>
          <input class="input" type="text" inputmode="decimal"
                 data-chave="${chave}" value="${escapeHTML(valor)}"
                 placeholder="0,00" aria-label="${label}">
        </div>`;
    }
    return `
      <div class="campo">
        ${labelHTML}
        <input class="input" type="${tipo}" data-chave="${chave}"
               value="${escapeHTML(valor)}" placeholder="${placeholder}" aria-label="${label}">
      </div>`;
  }

  /* ------------------------------------------------------------------
     RENDER — funcionário + resumo geral
     ------------------------------------------------------------------ */
  function renderFuncionario() {
    const f = estado.funcionario;
    $("#func").innerHTML = `
      <h2>${ic.user} Funcionário</h2>
      <div class="func-grid">
        ${campo({ label: "Nome do funcionário", icone: ic.user, chave: "func.nome", valor: f.nome, placeholder: "Ex.: João da Silva" })}
        ${campo({ label: "Cargo", icone: ic.badge, chave: "func.cargo", valor: f.cargo, placeholder: "Ex.: Atendente" })}
        ${campo({ label: "Salário base", icone: ic.money, chave: "func.salarioBase", valor: f.salarioBase, moeda: true })}
      </div>`;
  }

  function renderResumo() {
    const t = totaisGerais();
    $("#resumo").innerHTML = `
      <div class="resumo__card resumo__card--ic">
        <span class="ic" style="color:var(--dourado-2)">${ic.coins}</span>
        <span class="rot">Salários (período)</span>
        <span class="val">${moeda(t.salario)}</span>
      </div>
      <div class="resumo__card resumo__card--ic">
        <span class="ic" style="color:var(--dourado-2)">${ic.wallet}</span>
        <span class="rot">Vales + Adiant.</span>
        <span class="val">${moeda(t.vale + t.adiant)}</span>
      </div>
      <div class="resumo__card resumo__card--pago resumo__card--ic">
        <span class="ic" style="color:var(--verde)">${ic.check}</span>
        <span class="rot">Total recebido</span>
        <span class="val">${moeda(t.recebido)}</span>
      </div>
      <div class="resumo__card resumo__card--saldo resumo__card--ic">
        <span class="ic" style="color:var(--vermelho)">${ic.money}</span>
        <span class="rot">Saldo a pagar</span>
        <span class="val">${moeda(t.saldo)}</span>
      </div>`;
  }

  /* ------------------------------------------------------------------
     RENDER — um mês (card accordion)
     ------------------------------------------------------------------ */
  function renderMes(def) {
    const mes = estado.meses[def.id];
    const saldo = saldoMes(mes);
    const recebido = recebidoMes(mes);
    const temSaldo = Math.abs(saldo) > 0.001;

    // pílula de status no cabeçalho
    const pill = (recebido <= 0)
      ? `<span class="mes__pill mes__pill--saldo">A lançar</span>`
      : (saldo > 0.001)
        ? `<span class="mes__pill mes__pill--saldo">Falta ${moeda(saldo)}</span>`
        : `<span class="mes__pill mes__pill--pago">Quitado ✓</span>`;

    return `
      <section class="mes${mes.aberto ? " aberto" : ""}" data-mes="${def.id}">
        <button class="mes__cabeca" type="button" aria-expanded="${mes.aberto}">
          <div class="mes__mesano">
            <strong>${def.nome} <span style="color:var(--dourado-2)">${def.ano}</span></strong>
            <span>Recebido ${moeda(recebido)} · Salário ${moeda(salarioDoMes(mes))}</span>
          </div>
          ${pill}
          <span class="mes__seta">${ic.chevron}</span>
        </button>

        <div class="mes__corpo"><div>
          <div class="mes__conteudo">

            <div class="bloco-linha">
              <!-- VALE -->
              <div class="bloco bloco--vale">
                <div class="bloco__titulo"><span class="bloco__ic">${ic.vale}</span> Vale</div>
                <div class="bloco__grid">
                  ${campo({ label: "Data do vale", icone: ic.cal, tipo: "date", chave: `${def.id}.valeData`, valor: mes.valeData })}
                  ${campo({ label: "Valor do vale", chave: `${def.id}.valeValor`, valor: mes.valeValor, moeda: true })}
                </div>
              </div>

              <!-- ADIANTAMENTO -->
              <div class="bloco bloco--adiant">
                <div class="bloco__titulo"><span class="bloco__ic">${ic.adiant}</span> Adiantamento</div>
                <div class="bloco__grid">
                  ${campo({ label: "Data do adiantamento", icone: ic.cal, tipo: "date", chave: `${def.id}.adiantData`, valor: mes.adiantData })}
                  ${campo({ label: "Valor do adiantamento", chave: `${def.id}.adiantValor`, valor: mes.adiantValor, moeda: true })}
                </div>
              </div>

              <!-- PAGAMENTO -->
              <div class="bloco bloco--pag">
                <div class="bloco__titulo"><span class="bloco__ic">${ic.pag}</span> Pagamento</div>
                <div class="bloco__grid">
                  ${campo({ label: "Data do pagamento", icone: ic.cal, tipo: "date", chave: `${def.id}.pagData`, valor: mes.pagData })}
                  ${campo({ label: "Valor pago", chave: `${def.id}.pagValor`, valor: mes.pagValor, moeda: true })}
                </div>
              </div>
            </div>

            <!-- salário do mês (opcional) + observações -->
            <div class="bloco__grid" style="grid-template-columns:1fr">
              ${campo({ label: "Salário base deste mês (se diferente)", icone: ic.money, chave: `${def.id}.salario`, valor: mes.salario, moeda: true })}
              <div class="campo">
                <label>${ic.note} Observações</label>
                <textarea class="textarea" data-chave="${def.id}.obs"
                          placeholder="Anotações sobre este mês…" aria-label="Observações">${escapeHTML(mes.obs)}</textarea>
              </div>
            </div>

            <!-- resumo do mês -->
            <div class="mes-resumo">
              <div class="mes-resumo__item mes-resumo__item--pago">
                <span class="r">Recebido no mês</span>
                <span class="v">${moeda(recebido)}</span>
              </div>
              <div class="mes-resumo__item mes-resumo__item--saldo">
                <span class="r">Saldo a pagar</span>
                <span class="v">${moeda(saldo)}</span>
              </div>
            </div>

          </div>
        </div></div>
      </section>`;
  }

  function renderMeses() {
    $("#meses").innerHTML = MESES.map(renderMes).join("");
  }

  /* ------------------------------------------------------------------
     RENDER GERAL + data do relatório
     ------------------------------------------------------------------ */
  function render() {
    renderFuncionario();
    renderResumo();
    renderMeses();
  }

  function pintarData() {
    const hoje = new Date();
    $("#dataRelatorio").textContent =
      hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  }

  /* ------------------------------------------------------------------
     EVENTOS — edição dos campos (delegação)
     ------------------------------------------------------------------ */
  // Atualiza o estado conforme digita (sem re-render, pra não perder o foco)
  function aoEditar(e) {
    const el = e.target.closest("[data-chave]");
    if (!el) return;
    const chave = el.dataset.chave;
    const valor = el.value;

    if (chave.startsWith("func.")) {
      estado.funcionario[chave.split(".")[1]] = valor;
    } else {
      const [mesId, campoNome] = [chave.slice(0, 7), chave.slice(8)];
      if (estado.meses[mesId]) estado.meses[mesId][campoNome] = valor;
    }

    // atualiza só os resumos (não re-renderiza inputs em edição)
    atualizarResumosLeves();
    salvar(true); // autosave silencioso
  }

  // Atualiza pílulas e totais sem recriar os inputs (mantém foco/teclado)
  function atualizarResumosLeves() {
    renderResumo();
    for (const def of MESES) {
      const mes = estado.meses[def.id];
      const sec = $(`.mes[data-mes="${def.id}"]`);
      if (!sec) continue;
      const recebido = recebidoMes(mes);
      const saldo = saldoMes(mes);

      // subtítulo do cabeçalho
      const sub = $(".mes__mesano span", sec);
      if (sub) sub.textContent = `Recebido ${moeda(recebido)} · Salário ${moeda(salarioDoMes(mes))}`;

      // pílula
      const pill = $(".mes__pill", sec);
      if (pill) {
        if (recebido <= 0) { pill.className = "mes__pill mes__pill--saldo"; pill.textContent = "A lançar"; }
        else if (saldo > 0.001) { pill.className = "mes__pill mes__pill--saldo"; pill.textContent = `Falta ${moeda(saldo)}`; }
        else { pill.className = "mes__pill mes__pill--pago"; pill.textContent = "Quitado ✓"; }
      }

      // resumo do mês (recebido / saldo)
      const itens = $$(".mes-resumo__item .v", sec);
      if (itens[0]) itens[0].textContent = moeda(recebido);
      if (itens[1]) itens[1].textContent = moeda(saldo);
    }
  }

  // Abrir/fechar accordion
  function aoClicarCabeca(e) {
    const cab = e.target.closest(".mes__cabeca");
    if (!cab) return;
    const sec = cab.closest(".mes");
    const id = sec.dataset.mes;
    estado.meses[id].aberto = !estado.meses[id].aberto;
    sec.classList.toggle("aberto", estado.meses[id].aberto);
    cab.setAttribute("aria-expanded", estado.meses[id].aberto);
    salvar(true);
  }

  /* ------------------------------------------------------------------
     TOAST
     ------------------------------------------------------------------ */
  let toastTimer;
  function toast(msg, erro = false) {
    const t = $("#toast");
    t.innerHTML = `${erro ? "" : ic.check} ${msg}`;
    t.style.background = erro ? "var(--vermelho)" : "var(--verde)";
    t.style.color = erro ? "#fff" : "#04240F";
    t.classList.add("mostrar");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("mostrar"), 2600);
  }

  /* ------------------------------------------------------------------
     PDF (impressão) — abre todos os meses e chama window.print()
     ------------------------------------------------------------------ */
  function gerarPDF() {
    // garante que todos os meses estejam abertos para o PDF
    const anteriores = {};
    for (const def of MESES) {
      anteriores[def.id] = estado.meses[def.id].aberto;
      estado.meses[def.id].aberto = true;
    }
    render();

    // pequena espera pro layout assentar, então imprime
    setTimeout(() => {
      window.print();
      // restaura o estado de abertura depois de imprimir
      for (const def of MESES) estado.meses[def.id].aberto = anteriores[def.id];
      render();
    }, 250);
  }

  /* ------------------------------------------------------------------
     LIMPAR TUDO
     ------------------------------------------------------------------ */
  function limparTudo() {
    if (!confirm("Apagar todos os dados salvos deste dispositivo? Esta ação não pode ser desfeita.")) return;
    estado = estadoPadrao();
    localStorage.removeItem(CHAVE);
    render();
    toast("Tudo limpo. Comece um novo controle.");
  }

  /* ------------------------------------------------------------------
     INICIALIZAÇÃO
     ------------------------------------------------------------------ */
  function init() {
    pintarData();
    render();

    // delegação de eventos
    document.addEventListener("input", aoEditar);
    document.addEventListener("change", aoEditar);   // datas (date picker)
    $("#meses").addEventListener("click", aoClicarCabeca);

    // botões de ação
    $("#btnSalvar").addEventListener("click", () => salvar(false));
    $("#btnPDF").addEventListener("click", gerarPDF);
    $("#btnLimpar").addEventListener("click", limparTudo);

    // atalho: Ctrl/Cmd+S salva
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); salvar(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault(); gerarPDF();
      }
    });

    // abre o primeiro mês por padrão se nada estiver aberto
    if (!MESES.some((m) => estado.meses[m.id].aberto)) {
      estado.meses[MESES[0].id].aberto = true;
      render();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
