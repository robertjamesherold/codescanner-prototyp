import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/layout";
import Home from "@/pages/Home";
import Recent from "@/pages/Recent";
import Uebersicht from "@/pages/Uebersicht";
import Bereinigen from "@/pages/Bereinigen";
import Absichern from "@/pages/Absichern";
import Optimieren from "@/pages/Optimieren";
import Settings from "@/pages/Settings";
import Import from "@/pages/Import";

function App() {
  return (
    <BrowserRouter>
      <Layout.Page >
        <Routes>
          {/* Standard-Routen → Sidebar v1 */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/home" />} />
          <Route path="/recent" element={<Recent />} />
          <Route path="/einstellungen" element={<Settings />} />
          <Route path="/import" element={<Import />} />
          <Route path="/current" element={<div />} />
          <Route path="/community" element={<div />} />

          {/* Projekt-Routen → Sidebar v2 */}
          <Route path="/übersicht" element={<Uebersicht />} />
          <Route path="/bereinigen" element={<Bereinigen />} />
          <Route path="/absichern" element={<Navigate to="/absichern/kritisch" />} />
          <Route path="/absichern/kritisch" element={<Absichern severity="kritisch" />} />
          <Route path="/absichern/hoch" element={<Absichern severity="hoch" />} />
          <Route path="/absichern/mittel" element={<Absichern severity="mittel" />} />
          <Route path="/absichern/niedrig" element={<Absichern severity="niedrig" />} />
          <Route path="/optimieren" element={<Optimieren />} />
        </Routes>
      </Layout.Page>
    </BrowserRouter>
  );
}

export default App;
