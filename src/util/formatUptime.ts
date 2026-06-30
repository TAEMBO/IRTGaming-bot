export function formatUptime(uptime: number) {
    if (!uptime) return "0:00";

    const uptimeHrs = Math.floor(uptime / 60);
    const uptimeMins = Math.floor(uptime % 60).toString().padStart(2, "0");

    return uptimeHrs + ":" + uptimeMins;
}