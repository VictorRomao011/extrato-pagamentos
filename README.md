# 💰 Controle de Vale e Pagamentos — Adega da Naty

### 🔗 Acesse o sistema: **https://victorromao011.github.io/extrato-pagamentos/**

> Ferramenta web para controlar **Vale, Adiantamento e Pagamento** de um
> funcionário, de **Junho a Dezembro de 2026**. Funciona no celular e no
> computador, sem instalar nada.

---

## Como publicar no GitHub Pages

1. Suba os arquivos deste repositório para a branch `main` (o `index.html`
   precisa ficar na **raiz**).
2. No GitHub, vá em **Settings → Pages**.
3. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
4. Selecione a branch **main** e a pasta **/(root)** → **Save**.
5. Aguarde ~1 minuto e acesse:
   **https://victorromao011.github.io/extrato-pagamentos/**

> O arquivo `.nojekyll` já vai junto — ele garante que a pasta `assets/`
> seja servida corretamente. Não apague.

## O que ela faz

- **Cabeçalho** com o logo, nome da adega, título e a data de geração.
- **Funcionário**: nome, cargo e salário base (editáveis).
- **7 meses** (Jun–Dez/2026), cada um em um **card recolhível (accordion)** com:
  - Vale (data + valor)
  - Adiantamento (data + valor)
  - Pagamento (data + valor)
  - Salário base do mês (opcional, se diferente do padrão)
  - Observações (campo livre)
- **Resumo automático**: por mês e geral, mostrando **total recebido** e
  **saldo a pagar** (salário − vale − adiantamento − pagamento). A pílula de
  cada mês indica "A lançar", "Falta R$ X" ou "Quitado ✓".
- **Date picker nativo** nas datas (ótimo no celular).
- **Salvar Dados**: guarda tudo no navegador (LocalStorage). Ao reabrir, os
  dados continuam lá. Há também **autosave** a cada edição.
- **Gerar PDF**: abre a janela de impressão já formatada em **A4** como
  relatório financeiro (logo, cabeçalho, todos os meses, boa quebra de página).
  No celular, escolha "Salvar como PDF" na tela de impressão.
- **Limpar**: apaga os dados salvos (com confirmação).

## Atalhos

- `Ctrl/Cmd + S` → Salvar
- `Ctrl/Cmd + P` → Gerar PDF

## Observações

- Os valores aceitam tanto `1.500,50` quanto `1500.5`.
- Tudo é local: nada é enviado para nenhum servidor. Para guardar uma cópia
  fora do navegador, use o **Gerar PDF**.

## Tecnologias

HTML5, CSS3 e JavaScript puro. Sem frameworks, sem backend, sem dependências.
