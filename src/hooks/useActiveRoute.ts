import { useMatch } from "react-router-dom";

/**
 * Prüft, ob die übergebene Route der aktuell aktiven Route entspricht.
 *
 * @param path  Pfad des Links, z.B. "/home".
 * @param exact true = nur exakter Treffer, false = auch Unterrouten (z.B. "/home/details").
 * @returns     true, wenn der Link aktiv ("visited") ist.
 */
const useActiveRoute = (path: string, exact = false): boolean => {
  const match = useMatch({ path, end: exact });
  return Boolean(match);
};

export default useActiveRoute;
