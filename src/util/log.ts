import { LogColor } from "./logColor.js";

/**
 * Log things to console with color options
 * @param color The color of the log
 * @param data The data to be logged
 */
export function log(color: keyof typeof LogColor, ...data: any[]) {
    console.log(`${LogColor[color]}[${(new Date()).toLocaleString("en-GB")}]`, ...data, LogColor.Reset);
}