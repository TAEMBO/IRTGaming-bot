import moment from 'moment';
import { LogColor } from '../typings.js';

/**
 * Log things to console with color options
 * @param color The color of the log
 * @param data The data to be logged
 */
export function log(color: LogColor, ...data: any[]) {
    console.log(`${color}[${moment().format('HH:mm:ss')}]`, ...data);
}