import { BadgeInfo, Button, Card, CardGrid, Selo, Table } from "./components/ui";

/**
 * Vitrine dos componentes base do F0-06. Prova que os tokens/CSS do design
 * system estão funcionando; a shell real (login, navegação por perfil,
 * roteamento) é construída em F2.
 */
function App() {
  return (
    <main className="conteudo">
      <div className="view-cabecalho">
        <h2>Sistema de Premiações — fundação do frontend</h2>
        <span className="view-subtitulo">F0 concluído: tokens de design e componentes base</span>
      </div>

      <CardGrid>
        <Card titulo="Colaboradores">
          <p>6</p>
        </Card>
        <Card titulo="Filiais">
          <p>19</p>
        </Card>
        <Card titulo="Total premiação (mês)" destaque>
          <p>R$ 0,00</p>
        </Card>
      </CardGrid>

      <div className="acoes-rapidas" style={{ marginBottom: "var(--esp-6)" }}>
        <Button variant="primario">Ação primária</Button>
        <Button variant="dourado">Ação dourada</Button>
        <Button variant="secundario">Ação secundária</Button>
        <Button variant="texto">Ação de texto</Button>
        <Button variant="perigo">Remover</Button>
      </div>

      <div style={{ display: "flex", gap: "var(--esp-3)", marginBottom: "var(--esp-6)", flexWrap: "wrap" }}>
        <BadgeInfo>Filial 100</BadgeInfo>
        <BadgeInfo perfil>Administrador</BadgeInfo>
        <BadgeTela>Premiação</BadgeTela>
        <Selo variante="sucesso">Em dia</Selo>
        <Selo variante="alerta">Pendente</Selo>
      </div>

      <Table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Colaborador</th>
            <th className="celula-numerica">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>001</td>
            <td>Carlos Silva</td>
            <td className="celula-numerica">R$ 1.200,00</td>
          </tr>
        </tbody>
      </Table>
    </main>
  );
}

export default App;
