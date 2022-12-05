class CRC {
    constructor() {
        this.INIT_CRC = 0xffffffff
        this.#makeTable()
    }
    calc(dataView, offset, length) { // Chunkのtypeとdataのバイナリ配列からCRC値を算出して返す
        return (this.#update(this.INIT_CRC, new Uint8Array(dataView.buffer, offset, length), length) ^ this.INIT_CRC) >>> 0;
    }
    #makeTable() {
        this._table = []
        for (let n = 0; n < 256; n++) {
            let c = n
            for (let k = 0; k < 8; k++) {
                if (c & 1) { c = 0xedb88320 ^ (c >>> 1) }
                else { c = c >>> 1 }
            }
            this._table[n] = c;
        }
    }
    #update(currentCrc, data, length) {
        let c = currentCrc
        for (let n = 0; n < length; n++) {
            c = this._table[(c ^ data[n]) & 0xff] ^ (c >>> 8);
        }
        return c;
    }
}
export default new CRC()
