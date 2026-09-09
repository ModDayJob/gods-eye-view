/** Settle every task while limiting simultaneous provider work. */
export async function settleLimited(items, work, limit = 2) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try { results[i] = {status:'fulfilled',value:await work(items[i])}; }
      catch (reason) { results[i] = {status:'rejected',reason}; }
    }
  }
  await Promise.all(Array.from({length:Math.min(items.length,Math.max(1,Math.floor(limit)||1))}, worker));
  return results;
}
