export function isValidCommand(obj: unknown) {
    return typeof obj === "object"
        && obj !== null
        && "run" in obj
        && typeof obj.run === "function"
        && "data" in obj
        && typeof obj.data === "object"
        && "uses" in obj
        && typeof obj.uses === "number";
}