/**
 * A real QR encoder, written out here rather than pulled in as a dependency.
 *
 * Byte mode, error-correction level M, versions 1-6 (up to 106 characters) —
 * far more than a reference like EV-2026-0311 needs. The matrix it returns is
 * a genuine QR symbol: a phone camera pointed at it reads back exactly the
 * string that went in, which is the whole point of printing it on a
 * certificate.
 */

/* ---------------------------------------------------------------- GF(256) */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function polyMul(a: number[], b: number[]): number[] {
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) out[i + j] ^= mul(a[i], b[j]);
  }
  return out;
}

/** Generator polynomial for `n` error-correction codewords. */
function generator(n: number): number[] {
  let poly = [1];
  for (let i = 0; i < n; i += 1) poly = polyMul(poly, [1, EXP[i]]);
  return poly;
}

/** The `n` error-correction codewords for one block of data codewords. */
function ecBytes(data: number[], n: number): number[] {
  const gen = generator(n);
  const rest = [...data, ...new Array<number>(n).fill(0)];
  for (let i = 0; i < data.length; i += 1) {
    const factor = rest[i];
    if (factor === 0) continue;
    for (let j = 0; j < gen.length; j += 1) rest[i + j] ^= mul(gen[j], factor);
  }
  return rest.slice(data.length);
}

/* ------------------------------------------------- version / block tables */

/** Level M: error codewords per block, and the blocks each version splits into. */
const VERSIONS: { ec: number; blocks: [count: number, data: number][] }[] = [
  { ec: 10, blocks: [[1, 16]] }, // 1
  { ec: 16, blocks: [[1, 28]] }, // 2
  { ec: 26, blocks: [[1, 44]] }, // 3
  { ec: 18, blocks: [[2, 32]] }, // 4
  { ec: 24, blocks: [[2, 43]] }, // 5
  { ec: 16, blocks: [[4, 27]] }, // 6
];

const ALIGN: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];

/** Remainder bits appended after the interleaved codewords. */
const REMAINDER = [0, 7, 7, 7, 7, 7];

const dataCodewords = (v: number) => VERSIONS[v - 1].blocks.reduce((a, [n, d]) => a + n * d, 0);

/** Longest string this encoder will take. */
export const QR_MAX_CHARS = dataCodewords(VERSIONS.length) - 2;

function utf8(value: string): number[] {
  const out: number[] = [];
  for (const byte of new TextEncoder().encode(value)) out.push(byte);
  return out;
}

/* ------------------------------------------------------------- bit stream */

function codewordsFor(bytes: number[], version: number): number[] {
  const capacity = dataCodewords(version) * 8;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
  };

  push(0b0100, 4); // byte mode
  push(bytes.length, 8); // versions 1-9 use an 8-bit count
  for (const b of bytes) push(b, 8);

  for (let i = 0; i < 4 && bits.length < capacity; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const words: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    words.push(bits.slice(i, i + 8).reduce((a, bit) => (a << 1) | bit, 0));
  }
  const pad = [0xec, 0x11];
  for (let i = 0; words.length < dataCodewords(version); i += 1) words.push(pad[i % 2]);
  return words;
}

/** Split into blocks, add error correction, interleave — as the standard requires. */
function interleave(words: number[], version: number): number[] {
  const { ec, blocks } = VERSIONS[version - 1];
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let at = 0;
  for (const [count, size] of blocks) {
    for (let i = 0; i < count; i += 1) {
      const block = words.slice(at, at + size);
      at += size;
      dataBlocks.push(block);
      ecBlocks.push(ecBytes(block, ec));
    }
  }

  const out: number[] = [];
  const longest = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < longest; i += 1) {
    for (const block of dataBlocks) if (i < block.length) out.push(block[i]);
  }
  for (let i = 0; i < ec; i += 1) {
    for (const block of ecBlocks) out.push(block[i]);
  }
  return out;
}

/* ----------------------------------------------------------------- matrix */

type Grid = (boolean | null)[][];

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function blank(size: number): Grid {
  return Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null));
}

function placeFinders(grid: Grid, size: number) {
  const corners = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
  for (const [row, col] of corners) {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        const y = row + r;
        const x = col + c;
        if (y < 0 || y >= size || x < 0 || x >= size) continue;
        const on =
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        grid[y][x] = on;
      }
    }
  }
}

function placeAlignment(grid: Grid, version: number) {
  const centers = ALIGN[version - 1];
  for (const row of centers) {
    for (const col of centers) {
      if (grid[row][col] !== null) continue;
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          grid[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        }
      }
    }
  }
}

function placeTiming(grid: Grid, size: number) {
  for (let i = 8; i < size - 8; i += 1) {
    if (grid[6][i] === null) grid[6][i] = i % 2 === 0;
    if (grid[i][6] === null) grid[i][6] = i % 2 === 0;
  }
}

/** BCH(15,5) with the level-M indicator, as the format information field. */
function formatBits(mask: number): number {
  const data = (0b00 << 3) | mask;
  let d = data << 10;
  for (let i = 4; i >= 0; i -= 1) {
    if ((d >> (10 + i)) & 1) d ^= 0x537 << i;
  }
  return (((data << 10) | d) ^ 0x5412) & 0x7fff;
}

function placeFormat(grid: Grid, size: number, mask: number) {
  const bits = formatBits(mask);
  for (let i = 0; i < 15; i += 1) {
    const on = ((bits >> i) & 1) === 1;
    if (i < 6) grid[i][8] = on;
    else if (i < 8) grid[i + 1][8] = on;
    else grid[size - 15 + i][8] = on;

    if (i < 8) grid[8][size - i - 1] = on;
    else if (i < 9) grid[8][15 - i] = on;
    else grid[8][15 - i - 1] = on;
  }
  grid[size - 8][8] = true; // the module that is always dark
}

function placeData(grid: Grid, size: number, words: number[], mask: number) {
  const maskFn = MASKS[mask];
  let inc = -1;
  let row = size - 1;
  let bit = 7;
  let index = 0;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (;;) {
      for (let c = 0; c < 2; c += 1) {
        const x = col - c;
        if (grid[row][x] !== null) continue;
        let dark = index < words.length ? ((words[index] >>> bit) & 1) === 1 : false;
        if (maskFn(row, x)) dark = !dark;
        grid[row][x] = dark;
        bit -= 1;
        if (bit === -1) {
          index += 1;
          bit = 7;
        }
      }
      row += inc;
      if (row < 0 || row >= size) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }
}

/** The four penalty rules. The mask with the lowest score is the one printed. */
function penalty(grid: boolean[][], size: number): number {
  let score = 0;

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      let same = 0;
      const dark = grid[r][c];
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const y = r + dr;
          const x = c + dc;
          if (y < 0 || y >= size || x < 0 || x >= size) continue;
          if (grid[y][x] === dark) same += 1;
        }
      }
      if (same > 5) score += 3 + same - 5;
    }
  }

  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const n = [grid[r][c], grid[r][c + 1], grid[r + 1][c], grid[r + 1][c + 1]].filter(Boolean).length;
      if (n === 0 || n === 4) score += 3;
    }
  }

  const finder = [true, false, true, true, true, false, true];
  const run = (get: (i: number) => boolean, length: number) => {
    let hits = 0;
    for (let i = 0; i + 7 <= length; i += 1) {
      let ok = true;
      for (let j = 0; j < 7; j += 1) {
        if (get(i + j) !== finder[j]) {
          ok = false;
          break;
        }
      }
      if (ok) hits += 1;
    }
    return hits;
  };
  for (let r = 0; r < size; r += 1) score += 40 * run((i) => grid[r][i], size);
  for (let c = 0; c < size; c += 1) score += 40 * run((i) => grid[i][c], size);

  let dark = 0;
  for (let r = 0; r < size; r += 1) for (let c = 0; c < size; c += 1) if (grid[r][c]) dark += 1;
  const ratio = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;

  return score;
}

/**
 * Encode a string as a QR symbol. Returns the module grid, row by row;
 * `true` is a dark module. The quiet zone is the caller's business.
 */
export function qrMatrix(value: string): boolean[][] {
  const bytes = utf8(value.slice(0, QR_MAX_CHARS));
  const version = VERSIONS.findIndex((_, i) => dataCodewords(i + 1) - 2 >= bytes.length) + 1 || VERSIONS.length;
  const size = version * 4 + 17;

  const words = interleave(codewordsFor(bytes, version), version);
  const padded = [...words];
  if (REMAINDER[version - 1] > 0) padded.push(0);

  let best: boolean[][] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask += 1) {
    const grid = blank(size);
    placeFinders(grid, size);
    placeAlignment(grid, version);
    placeTiming(grid, size);
    placeFormat(grid, size, mask);
    placeData(grid, size, padded, mask);
    const solid = grid.map((row) => row.map((cell) => cell === true));
    const score = penalty(solid, size);
    if (score < bestScore) {
      bestScore = score;
      best = solid;
    }
  }

  return best ?? blank(size).map((row) => row.map(() => false));
}
