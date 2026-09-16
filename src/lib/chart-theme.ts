export function getChartTheme(dark: boolean) {
  return {
    tick: dark ? "#94a3b8" : "#64748b",
    grid: dark ? "#1e293b" : "#e2e8f0",
    tooltipBg: dark ? "#0f172a" : "#ffffff",
    tooltipBorder: dark ? "#1e293b" : "#e2e8f0",
    tooltipText: dark ? "#f1f5f9" : "#0f172a",
  };
}
