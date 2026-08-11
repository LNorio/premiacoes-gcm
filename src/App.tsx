import { BarraCarregamentoGlobal } from "./components/BarraCarregamentoGlobal";
import { ToastHost } from "./components/ToastHost";
import { useSessao } from "./state/SessaoContext";
import { Login } from "./views/auth/Login";
import { Shell } from "./views/shell/Shell";

function App() {
  const { sessao } = useSessao();

  return (
    <>
      <BarraCarregamentoGlobal />
      {sessao ? <Shell /> : <Login />}
      <ToastHost />
    </>
  );
}

export default App;
