/** 
 * A manager for profanity in a set of text
 * @param text The text to analyze for profanity
 */
export class Profanity {
    private loopCount = 0;

    constructor(private _text: string) { }
    
    private allPossibleCases(arr: string[][]) {
        this.loopCount++;
    
        if (arr.length === 1 || this.loopCount > 20) return arr[0];
    
        const result: string[] = [];
        const allCasesOfRest = this.allPossibleCases(arr.slice(1));
    
        for (let i = 0; i < allCasesOfRest.length; i++) {
            for (let j = 0; j < arr[0].length; j++) result.push(arr[0][j] + allCasesOfRest[i]);
        }
    
        return result;
    }

    /**
     * Parse this text for all forms of possible profanity
     * @returns An array of each word of the text with all words parsed for possibly profanity
     */
    public getProfanity() {
        this._text = this._text.replace(/[^a-zA-Z\s]/g, "");

        for (const [regExp, str] of new Map([
            [/!/g, "i"],
            [/@/g, "a"],
            [/\$/g, "s"],
            [/3/g, "e"],
            [/1/g, "i"],
            [/¡/g, "i"],
            [/5/g, "s"],
            [/0/g, "o"],
            [/4/g, "h"],
            [/7/g, "t"],
            [/9/g, "g"],
            [/6/g, "b"],
            [/8/g, "b"]
        ])) this._text = this._text.replace(regExp, str);
    
        return this._text
            .split(" ")
            .map(word => {
                if (/(.)\1{1,}/.test(word) && word.length > 3) {
                    const val: string[] = [];
                    const arr: string[][] = [];
                    let chop = word[0];
                
                    for (let i = 1; i <= word.length; i++) {
                        if (chop[0] != word[i]) {
                            val.push(chop);
                            chop = word[i];
                        } else chop += word[i];
                    }
                
                    for (let i = 0; i < val.length; i++) {
                        const temp: string[] = [];
    
                        if (val[i].length >= 2) temp.push(val[i][0].repeat(2));
    
                        temp.push(val[i][0]);
                        arr.push(temp);
                    }
                
                    return this.allPossibleCases(arr).join(" ");
                } else return word;
            })
            .join(" ")
            .replace(/ +(?= )/g, "")
            .split(" ");
    }

    /**
     * Check whether profanity exists in this text or not, after being parsed
     * @param profanityList A list of words that are considered as profanity
     */
    public hasProfanity(profanityList: string[]) {
        const parsedText = this.getProfanity();
        
        return profanityList.some(word => parsedText.includes(word));
    }

    /**
     * Check whether a given word exists in this text or not, after being parsed
     * @param word The word to check for
     */
    public hasWord(word: string) {
        return this.getProfanity().includes(word);
    }
}