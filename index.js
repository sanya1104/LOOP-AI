// index.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { enqueueBatch, startWorker } = require('./queue');
const { ingestionMap, batchMap } = require('./store');

const app = express();
app.use(express.json());

startWorker();

app.post('/ingest', (req, res) => {
  const { ids, priority } = req.body;
  if (!Array.isArray(ids) || !priority) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const ingestionId = uuidv4();
  ingestionMap.set(ingestionId, []);

  for (let i = 0; i < ids.length; i += 3) {
    const batchIds = ids.slice(i, i + 3);
    const batchId = uuidv4();
    const batch = {
      batchId,
      ids: batchIds,
      priority,
      status: 'yet_to_start',
      ingestionId,
      createdAt: Date.now()
    };
    batchMap.set(batchId, batch);
    ingestionMap.get(ingestionId).push(batchId);
    enqueueBatch(batch);
  }

  res.json({ ingestion_id: ingestionId });
});

app.get('/status/:ingestionId', (req, res) => {
  const ingestionId = req.params.ingestionId;
  const batchIds = ingestionMap.get(ingestionId);

  if (!batchIds) {
    return res.status(404).json({ error: 'Ingestion ID not found' });
  }

  const batches = batchIds.map(batchId => {
    const b = batchMap.get(batchId);
    return {
      batch_id: b.batchId,
      ids: b.ids,
      status: b.status
    };
  });

  let overallStatus = 'yet_to_start';
  if (batches.every(b => b.status === 'completed')) {
    overallStatus = 'completed';
  } else if (batches.some(b => b.status === 'triggered' || b.status === 'completed')) {
    overallStatus = 'triggered';
  }

  res.json({
    ingestion_id: ingestionId,
    status: overallStatus,
    batches
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

});
module.exports = app;  // Export the Express app object

