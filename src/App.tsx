import { BarraCarregamentoGlobal } from "./components/BarraCarregamentoGlobal";
import { ToastHost } from "./components/ToastHost";
import { useSessao } from "./state/SessaoContext";
import { Login } from "./views/auth/Login";
import { TrocarSenhaObrigatoria } from "./views/auth/TrocarSenhaObrigatoria";
import { Shell } from "./views/shell/Shell";

function App() {
  const { sessao } = useSessao();

  function telaAtual() {
    if (!sessao) return <Login />;
    if (sessao.precisaTrocarSenha) return <TrocarSenhaObrigatoria />;
    return <Shell />;
  }

  return (
    <>
      <BarraCarregamentoGlobal />
      {telaAtual()}
      <ToastHost />
    </>
  );
}

export default App;
