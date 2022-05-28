export const hexToDec = (hex: String) => {
    return Number(hex)
}

export const DecToRGB = (dec: number) => {
    let r = Math.floor(dec / (256 * 256));
    let g = Math.floor(dec / 256) % 256;
    let b = dec % 256;
    return [r, g, b]
}

export const coordToIndex = (x: number, y: number) => {
    return x * 1000 + y;
}

export const indexToCoord = (index: number) => {
    let x = Math.floor(index / 1000);
    let y = index % 1000;
    return [x, y]
}