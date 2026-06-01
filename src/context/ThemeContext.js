import { createContext, useContext, useState, useEffect } from 'react';

const Ctx = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const toggle = () => setDark(d => !d);
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);
  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
