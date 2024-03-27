enum LogColor {
    Black = "\x1b[30m",
    Red = "\x1b[31m",
    Green = "\x1b[32m",
    Yellow = "\x1b[33m",
    Blue = "\x1b[34m",
    Purple = "\x1b[35m",
    Cyan = "\x1b[36m",
    White = "\x1b[37m",
    Grey = "\x1b[90m",
    Reset = "\x1b[0m"
}

/**
 * Log things to console with color options
 * @param color The color of the log
 * @param data The data to be logged
 */
export function log(color: keyof typeof LogColor, ...data: any[]) {
    console.log(`${LogColor[color]}[${(new Date()).toLocaleString("en-GB")}]`, ...data, LogColor.Reset);
}