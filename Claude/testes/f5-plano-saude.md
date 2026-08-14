# Testes — F5: Plano de Saúde

Data: 2026-08-12

## Escopo testado

Implementação completa do marco F5 — Plano de Saúde: `PlanoSaude.tsx` (contêiner com sub-abas), `CadastroTitulares.tsx` (F5.PS-CAD, titulares/dependentes/adesão) e `LancamentoPlanoSaude.tsx` (F5.PS-LAN, lançamento mensal Saúde/Odontológico). Também cobre o novo `case "plano-saude"` em `Shell.tsx`.

## Casos de teste

### CadastroTitulares (F5.PS-CAD)
- [x] Lista os titulares da filial (habilitados para `telas.planoSaude`), com adesão marcada por padrão (`undefined` tratado como aderido).
- [x] Admin desmarca a adesão de um titular e a mudança persiste (via `salvarAdesao`).
- [x] Coordenador vê as checkboxes desabilitadas e sem os botões de gerenciar dependente ("+ Dependente"/"Remover").
- [x] Admin adiciona um dependente pela modal e ele aparece indentado, com a adesão espelhada do titular (✓/— como texto, não checkbox própria).
- [x] Admin remove um dependente já cadastrado.
- [x] Admin em "Todas as filiais" vê a coluna Filial.

### LancamentoPlanoSaude (F5.PS-LAN)
- [x] Mostra o valor fixo padrão (R$ 185,27) na coluna Titular para a filial 100.
- [x] Usa o valor diferenciado (R$ 255,54) para as filiais 401/403.
- [x] Sub-aba Odontológico usa o valor fixo de R$ 13,56, sem campos editáveis nem botão de salvar (nada para lançar nesse plano).
- [x] Edita valor adicional/coparticipação (sub-aba Saúde), salva, e o total da linha reflete a soma em tempo real.
- [x] Admin numa filial específica vê o botão de bloqueio na sub-aba Saúde; em "Todas as filiais" ou na sub-aba Odontológico, não.
- [x] Admin em "Todas as filiais" vê a coluna Filial.
- [ ] Coluna `***` (`.celula-bloqueada`) na linha de dependente/titular — coberta indiretamente pelo snapshot de DOM durante o debug do bug do total por linha, mas sem asserção dedicada; considerar cobrir explicitamente se a tela for revisitada.

### PlanoSaude (sub-abas)
- [x] Começa na sub-aba "Titulares e Dependentes" e troca para "Lançamento" ao clicar, e volta.

### Shell
- [x] Aba "Plano de Saúde" já renderiza a tela real, não mais o placeholder `EmConstrucao`.

## Resultado da execução

- Comando: `npx vitest run src/views/planoSaude src/views/shell`
- Total: 19 testes novos (5 de `CadastroTitulares.test.tsx`, 7 de `LancamentoPlanoSaude.test.tsx`, 1 de `PlanoSaude.test.tsx`, 1 novo em `Shell.test.tsx`, + os já existentes de `Shell.test.tsx`), todos passando.
- Suíte completa do projeto: `npx vitest run` — 219 testes, 219 passaram, 0 falharam.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Bug real encontrado e corrigido antes de finalizar a tela:** o total por linha em `LancamentoPlanoSaude.tsx` usava o lançamento já salvo (`lancamentos.find(...)`, desatualizado) em vez do valor em edição (`valoresExtras`, estado local) — editar um campo mudava o rodapé (que já usava o estado certo) mas não o total daquela linha específica. Pego pelo teste "edita valor adicional/coparticipação, salva e o total da linha reflete a soma" antes de qualquer commit.
- **Achado à parte, sem relação com Plano de Saúde:** rodar a suíte completa revelou `Premiacao.test.tsx`/`Comissao.test.tsx` quebrados por um rótulo já renomeado pelo usuário diretamente no código ("PEV" → "PEV Atingida", "Comissão" → "Comissão (PEV Base)") — testes atualizados para os rótulos atuais; ver `Claude/eventos-roadmap.md`.
