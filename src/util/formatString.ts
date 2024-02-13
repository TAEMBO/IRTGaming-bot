/**
 * Formats a string by making every first letter of each word (separated by a space) uppercase
 * @param text The text to format
 * @returns 
 */
export function formatString(text: string) {
    text = text.trim();

    if (text.includes(" ")) {
        return text
            .split(" ")
            .map(x => x[0].toUpperCase() + x.slice(1))
            .join(" ");
    } else {
        return text[0].toUpperCase() + text.slice(1);
    }

}