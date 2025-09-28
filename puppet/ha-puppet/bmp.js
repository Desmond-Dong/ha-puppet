const supportedBitsPerPixel = [1, 24];

export class BMPEncoder {
  constructor(width, height, bitsPerPixel) {
    this.width = width;
    this.height = height;
    this.bitsPerPixel = bitsPerPixel;
    if (!supportedBitsPerPixel.includes(bitsPerPixel)) {
      throw new Error(`Unsupported bits per pixel. Supported values are: ${supportedBitsPerPixel.join(", ")}`);
    }

    // Each row in BMP must be padded to a multiple of 4 bytes
    const rowBytes = Math.ceil((this.width * this.bitsPerPixel) / 8);
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
    header.write("BM", 0, 2, "ascii");
    header.writeUInt32LE(fileSize, 2);
    header.writeUInt32LE(0, 6);
    header.writeUInt32LE(headerSize, 10);
    header.writeUInt32LE(40, 14);
    header.writeInt32LE(this.width, 18);
    header.writeInt32LE(this.height, 22); // Positive height for bottom-up DIB
    header.writeUInt16LE(1, 26); // Number of color planes
    header.writeUInt16LE(this.bitsPerPixel, 28); // Bits per pixel
    header.writeUInt32LE(0, 30); // Compression (none)
    header.writeUInt32LE(this.height * this.paddedWidthBytes, 34); // Image size
    header.writeInt32LE(0, 38); // Horizontal resolution (pixels per meter)
    header.writeInt32LE(0, 42); // Vertical resolution (pixels per meter)
    header.writeUInt32LE(this.bitsPerPixel === 1 ? 2 : 0, 46); // Number of colors in color palette
    header.writeUInt32LE(this.bitsPerPixel === 1 ? 2 : 0, 50); // Important colors
    if (this.bitsPerPixel === 1) {
      header.writeUInt32LE(0x00000000, 54); // Color palette 0 - black
      header.writeUInt32LE(0x00FFFFFF, 58); // Color palette 1 - white
    }
    return header;
  }

  // Handles bitsPerPixel 1, 24

  createPixelData(imageData) {
    const pixelData = Buffer.alloc(this.height * this.paddedWidthBytes);

    if (this.bitsPerPixel === 1) {
      // 1bpp: imageData is expected to be a flat array of 0x00 (black) or 0xFF (white)
      for (let y = 0; y < this.height; y++) {
        let rowOffset = (this.height - 1 - y) * this.paddedWidthBytes;
        let byte = 0;
        let bitCount = 0;
        for (let x = 0; x < this.width; x++) {
          const pixel = imageData[y * this.width + x];
          byte <<= 1;
          if (pixel === 0xFF) {
            byte |= 1;
          }
          bitCount++;
          if (bitCount === 8 || x === this.width - 1) {
            // Shift remaining bits if last byte is not full
            if (bitCount < 8) {
              byte <<= (8 - bitCount);
            }
            pixelData.writeUInt8(byte, rowOffset++);
            byte = 0;
            bitCount = 0;
          }
        }
        // Padding
        for (let p = 0; p < this.padding; p++) {
          pixelData.writeUInt8(0, rowOffset++);
        }
      }
    } else if (this.bitsPerPixel === 24) {
      // 24bpp: imageData is expected to be a flat array of RGB triplets (row-major, top-down)
      for (let y = 0; y < this.height; y++) {
        let rowOffset = (this.height - 1 - y) * this.paddedWidthBytes;
        for (let x = 0; x < this.width; x++) {
          const idx = (y * this.width + x) * 3;
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];
          pixelData.writeUInt8(b, rowOffset++);
          pixelData.writeUInt8(g, rowOffset++);
          pixelData.writeUInt8(r, rowOffset++);
        }
        // Padding
        for (let p = 0; p < this.padding; p++) {
          pixelData.writeUInt8(0, rowOffset++);
        }
      }
    }

    return pixelData;
  }
}
