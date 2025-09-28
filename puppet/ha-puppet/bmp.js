const supportedBitsPerPixel = [1, 24];

export class BMPEncoder {
  constructor(width, height, bitsPerPixel) {
    this.width = width;
    this.height = height;
    this.bitsPerPixel = bitsPerPixel;

    if (!supportedBitsPerPixel.includes(bitsPerPixel)) {
      throw new Error(`Unsupported bits per pixel. Supported values are: ${supportedBitsPerPixel.join(", ")}`);
    }

    // 每行字节数必须 4 字节对齐
    let rowBytes = Math.ceil((this.width * this.bitsPerPixel) / 8);
    this.padding = (4 - (rowBytes % 4)) % 4;
    this.paddedWidthBytes = rowBytes + this.padding;
  }

  encode(data) {
    const header = this.createHeader();
    const pixelData = this.createPixelData(data);
    return Buffer.concat([header, pixelData]);
  }

  createHeader() {
    const headerSize = this.bitsPerPixel === 1 ? 62 : 54;
    const fileSize = headerSize + this.height * this.paddedWidthBytes;
    const header = Buffer.alloc(headerSize);

    // BMP 文件头
    header.write("BM", 0, 2, "ascii");
    header.writeUInt32LE(fileSize, 2);     // 文件大小
    header.writeUInt32LE(0, 6);            // 保留
    header.writeUInt32LE(headerSize, 10);  // 数据偏移

    // DIB header (BITMAPINFOHEADER)
    header.writeUInt32LE(40, 14);          // DIB header size
    header.writeInt32LE(this.width, 18);   
    header.writeInt32LE(-this.height, 22); // top-down
    header.writeUInt16LE(1, 26);           // color planes
    header.writeUInt16LE(this.bitsPerPixel, 28); // bits per pixel
    header.writeUInt32LE(0, 30);           // no compression
    header.writeUInt32LE(this.width * this.height * (this.bitsPerPixel / 8), 34); // image size
    header.writeInt32LE(0, 38);            // horz resolution
    header.writeInt32LE(0, 42);            // vert resolution
    header.writeUInt32LE(this.bitsPerPixel === 1 ? 2 : 0, 46); // colors in palette
    header.writeUInt32LE(this.bitsPerPixel === 1 ? 2 : 0, 50); // important colors

    // 1-bit palette
    if (this.bitsPerPixel === 1) {
      header.writeUInt32LE(0x00000000, 54); // black
      header.writeUInt32LE(0x00FFFFFF, 58); // white
    }

    return header;
  }

  createPixelData(imageData) {
    let offset = 0;
    const pixelData = Buffer.alloc(this.height * this.paddedWidthBytes);

    if (this.bitsPerPixel === 1) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const pixel = imageData[y * this.width + x];
          const byteIndex = y * this.paddedWidthBytes + Math.floor(x / 8);
          const bitIndex = x % 8;
          let currentByte = pixelData.readUInt8(byteIndex);
          if (pixel === 0xFF) {
            currentByte |= (1 << (7 - bitIndex));
          } else {
            currentByte &= ~(1 << (7 - bitIndex));
          }
          pixelData.writeUInt8(currentByte, byteIndex);
        }
      }
    } else if (this.bitsPerPixel === 24) {
      // imageData 必须是 RGB 连续三通道
      let rowStart = 0;
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = (y * this.width + x) * 3;
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];
          pixelData[offset++] = b;
          pixelData[offset++] = g;
          pixelData[offset++] = r;
        }
        // padding
        for (let p = 0; p < this.padding; p++) {
          pixelData[offset++] = 0;
        }
      }
    }

    return pixelData;
  }
}
