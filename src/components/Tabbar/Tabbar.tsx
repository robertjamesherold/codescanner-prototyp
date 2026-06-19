type TabbarProps = { 
    active: string; 
    setActive: (tab: string) => void;
    tabs: {
      Tabs: string[], Name: string
    } 
}

const Tabbar  = ({ active, setActive, tabs }: TabbarProps) => {
    const activeStyle = tabs.Name === "Optimieren"
      ? { color: "var(--performance)", borderBottom: "1px solid var(--performance)" } 
      : tabs.Name === "Bereinigen" ? { color: "var(--quality)", borderBottom: "1px solid var(--quality)" } : tabs.Name === "Kritisch" ? { color: "var(--critical)", borderBottom: "1px solid var(--critical)" } : tabs.Name === "Hoch" ? { color: "var(--high)", borderBottom: "1px solid var(--high)" } : tabs.Name === "Mittel" ? { color: "var(--medium)", borderBottom: "1px solid var(--medium)" } : { color: "var(--low)", borderBottom: "1px solid var(--low)" };

    return (
    <div className="flex gap-3 border-b border-border-1">
          {tabs.Tabs.map((t) => {
            const isActive = active === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActive(t)}
                className="px-4 py-3 text-xl leading-6 cursor-pointer"
                style={isActive ? activeStyle : { color: "var(--text-3)" }}  
              >
                {t}
              </button>
            );
          })}
        </div>)
}

export default Tabbar;