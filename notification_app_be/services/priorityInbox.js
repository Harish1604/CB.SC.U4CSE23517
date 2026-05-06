const { Log } = require('../../logging_middleware');

const PRIORITY_MAP = {
  'Placement': 1,
  'Result': 2,
  'Event': 3
};

function getTopPriority(notifications, limit = 5) {
  if (!notifications || notifications.length === 0) return [];

  Log("backend", "debug", "service", `sorting ${notifications.length} notifications for priority inbox`);

  const sorted = [...notifications].sort((a, b) => {
    const wA = PRIORITY_MAP[a.type] || 99;
    const wB = PRIORITY_MAP[b.type] || 99;
    if (wA !== wB) return wA - wB;

    const tA = new Date(a.created_at || a.createdAt).getTime();
    const tB = new Date(b.created_at || b.createdAt).getTime();
    return tB - tA;
  });

  return sorted.slice(0, limit);
}

function getTopPriorityHeap(notifications, limit = 5) {
  if (!notifications || notifications.length === 0) return [];
  if (notifications.length <= limit) return getTopPriority(notifications, limit);

  function score(n) {
    const w = PRIORITY_MAP[n.type] || 99;
    const t = new Date(n.created_at || n.createdAt).getTime();
    return w * 1e15 - t;
  }

  const heap = [];
  function swap(i, j) { [heap[i], heap[j]] = [heap[j], heap[i]]; }

  function bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (score(heap[i]) > score(heap[p])) { swap(i, p); i = p; }
      else break;
    }
  }

  function sinkDown(i) {
    while (true) {
      let largest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < heap.length && score(heap[l]) > score(heap[largest])) largest = l;
      if (r < heap.length && score(heap[r]) > score(heap[largest])) largest = r;
      if (largest !== i) { swap(i, largest); i = largest; }
      else break;
    }
  }

  for (const n of notifications) {
    if (heap.length < limit) {
      heap.push(n);
      bubbleUp(heap.length - 1);
    } else if (score(n) < score(heap[0])) {
      heap[0] = n;
      sinkDown(0);
    }
  }

  return getTopPriority(heap, limit);
}

module.exports = { getTopPriority, getTopPriorityHeap, PRIORITY_MAP };
