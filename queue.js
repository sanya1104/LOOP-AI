// queue.js

const { batchMap } = require('./store');
const { v4: uuidv4 } = require('uuid');

const PRIORITY_ORDER = { HIGH: 1, MEDIUM: 2, LOW: 3 };
const queue = [];

// Background processing
function startWorker() {
  setInterval(async () => {
    if (queue.length === 0) return;

    queue.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return priorityDiff !== 0 ? priorityDiff : a.createdAt - b.createdAt;
    });

    const batch = queue.shift();
    batch.status = "triggered";
    console.log(`Processing batch ${batch.batchId} with IDs:`, batch.ids);

    for (const id of batch.ids) {
      await new Promise(r => setTimeout(r, 1000)); // simulate external API delay
      console.log(`Processed ID: ${id}`);
    }

    batch.status = "completed";
  }, 5000); // 1 batch per 5 seconds
}

function enqueueBatch(batch) {
  queue.push(batch);
}

module.exports = { enqueueBatch, startWorker };
