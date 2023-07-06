/**
 * Credits to Toast for providing this
 * @param integer The bits or bytes to format
 * @param decimals The amount of decimal places to include
 * @param bitsOrBytes Whether the integer is of bits or bytes. `1000` or `1024`
 */
export function formatBytes(integer: number, decimals: number, bitsOrBytes: 1000 | 1024) {
    if (!integer) return '0 Bytes';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(integer) / Math.log(bitsOrBytes));

    return (integer / Math.pow(bitsOrBytes, i)).toFixed(decimals < 0 ? 0 : decimals) + ' ' + sizes[i];
}