const fs = require('fs');
let content = fs.readFileSync('components/compressor/ImageCard.tsx', 'utf8');

const correctBlock = `      const ext = image.compressedBlob.type === 'image/jpeg' ? '.jpg'
        : image.compressedBlob.type === 'image/webp' ? '.webp'
        : image.compressedBlob.type === 'image/png' ? '.png'
        : image.compressedBlob.type === 'image/avif' ? '.avif'
        : getExtensionFromType(image.compressedBlob.type)
      saveAs(blob, baseName + '_compressed' + ext)`;

// Find the broken block — starts with "const ext" and ends with "saveAs(...ext)"
const re = /[ \t]*const ext = image\.compressedBlob\.type[\s\S]*?saveAs\(blob, baseName \+ '_compressed' \+ ext\)/;
content = content.replace(re, correctBlock);
fs.writeFileSync('components/compressor/ImageCard.tsx', content);
console.log('Fixed ImageCard.tsx');
