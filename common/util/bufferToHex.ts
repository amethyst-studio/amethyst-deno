let compile = false;
const byteToHex: string[] = [];

export function bufferToHex(arrayBuffer: ArrayBuffer) {
  if (!compile) {
    for (let n = 0; n <= 0xff; ++n) {
      const hexOctet = n.toString(16).padStart(2, '0');
      byteToHex.push(hexOctet);
    }
    compile = true;
  }

  const buff = new Uint8Array(arrayBuffer);
  const octets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

  for (let i = 0; i < buff.length; ++i) {
    octets.push(byteToHex[buff[i]]);
  }

  return octets.join('');
}
