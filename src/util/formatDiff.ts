import { LogColor } from "./logColor.js";

// Credits to [John Resig](https://johnresig.com/projects/javascript-diff-algorithm/)
/**
 * Find the differences between two strings
 * @param oldText
 * @param newText
 * @returns `oldText` with ANSI red highlights for removed text, `newText` with ANSI green highlights for added text
 */
export function formatDiff(oldText: string, newText: string) {
    oldText = oldText.replace(/\s+$/, "");
    newText = newText.replace(/\s+$/, "");

    let oldTextChanges = "";
    let newTextChanges = "";
    const ns: Record<string, { rows: number[]; o?: null | string; n?: null | string }> = {};
    const os: Record<string, { rows: number[]; o?: null | string; n?: null | string }> = {};
    const oldChanges: { text: string; row: number }[] = oldText.split(/\s+/).map(x => ({ text: x, row: -1 }));
    const newChanges: { text: string; row: number }[] = newText.split(/\s+/).map(x => ({ text: x, row: -1 }));

    for (let i = 0; i < newChanges.length; i++) {
        if (!ns[newChanges[i].text]) ns[newChanges[i].text] = { rows: [], o: null };

        ns[newChanges[i].text].rows.push(i);
    }

    for (let i = 0; i < oldChanges.length; i++) {
        if (!os[oldChanges[i].text]) os[oldChanges[i].text] = { rows: [], n: null };

        os[oldChanges[i].text].rows.push(i);
    }

    for (const i in ns) {
        if (ns[i].rows.length == 1 && os[i] && os[i].rows.length == 1) {
            newChanges[ns[i].rows[0]] = { text: newChanges[ns[i].rows[0]].text, row: os[i].rows[0] };
            oldChanges[os[i].rows[0]] = { text: oldChanges[os[i].rows[0]].text, row: ns[i].rows[0] };
        }
    }

    for (let i = 0; i < newChanges.length - 1; i++) {
        if (
            newChanges[i].row > -1 &&
            newChanges[i + 1].row < 0 &&
            newChanges[i].row + 1 < oldChanges.length &&
            oldChanges[newChanges[i].row + 1].row < 0 &&
            newChanges[i + 1].text == oldChanges[newChanges[i].row + 1].text
        ) {
            newChanges[i + 1] = { text: newChanges[i + 1].text, row: newChanges[i].row + 1 };
            oldChanges[newChanges[i].row + 1] = { text: oldChanges[newChanges[i].row + 1].text, row: i + 1 };
        }
    }

    for (let i = newChanges.length - 1; i > 0; i--) {
        if (
            newChanges[i].row > 0 &&
            newChanges[i - 1].row < 0 &&
            oldChanges[newChanges[i].row - 1].row < 0 &&
            newChanges[i - 1].text == oldChanges[newChanges[i].row - 1].text
        ) {
            newChanges[i - 1] = { text: newChanges[i - 1].text, row: newChanges[i].row - 1 };
            oldChanges[newChanges[i].row - 1] = { text: oldChanges[newChanges[i].row - 1].text, row: i - 1 };
        }
    }

    if (!newChanges.length) {
        for (let i = 0; i < oldChanges.length; i++) oldTextChanges += LogColor.Red + oldChanges[i].text + " " + LogColor.Reset;
    } else {
        if (!newChanges[0].text) {
            for (let i = 0; i < oldChanges.length && !oldChanges[i].text; i++) {
                oldTextChanges += LogColor.Red + oldChanges[i].text + " " + LogColor.Reset;
            }
        }

        for (let i = 0; i < newChanges.length; i++) {
            if (newChanges[i].row < 0) {
                newTextChanges += LogColor.Green + newChanges[i].text + " " + LogColor.Reset;
            } else {
                let pre = "";

                for (let n = newChanges[i].row + 1; n < oldChanges.length && oldChanges[n].row < 1; n++) {
                    pre += LogColor.Red + oldChanges[n].text + " " + LogColor.Reset;
                }

                oldTextChanges += newChanges[i].text + " " + pre;
                newTextChanges += newChanges[i].text + " ";
            }
        }
    }

    return { oldText: oldTextChanges, newText: newTextChanges };
}
