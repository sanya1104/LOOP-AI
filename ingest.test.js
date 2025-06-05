const request = require('supertest');
const index = require('./index');
 // Your Express index exported from your server file

describe('Data Ingestion API', () => {

    test('Priority and rate limit respected', async () => {
  // Submit low priority ingestion
  const lowPriorityRes = await request(index)
    .post('/ingest')
    .send({ ids: [1, 2, 3, 4], priority: 'LOW' })
    .set('Accept', 'application/json');

  // Wait 1 second before submitting high priority request
  await new Promise(r => setTimeout(r, 1000));

  // Submit high priority ingestion
  const highPriorityRes = await request(index)
    .post('/ingest')
    .send({ ids: [5, 6, 7], priority: 'HIGH' })
    .set('Accept', 'application/json');

  // Wait enough time for the batches to be processed according to your rate limit (e.g., 12 seconds)
  await new Promise(r => setTimeout(r, 12000));

  // Check status of both ingestions
  const lowStatus = await request(index).get(`/status/${lowPriorityRes.body.ingestion_id}`);
  const highStatus = await request(index).get(`/status/${highPriorityRes.body.ingestion_id}`);

  // Assertions to verify priorities and rate limit respected:
  
  // High priority batches should at least be triggered or completed before low priority batches finish
  const highBatchesStatus = highStatus.body.batches.map(b => b.status);
  const lowBatchesStatus = lowStatus.body.batches.map(b => b.status);

  expect(highBatchesStatus).toEqual(expect.arrayContaining(['triggered', 'completed']));
  // At least one low priority batch should still be either yet_to_start or triggered after waiting
  expect(lowBatchesStatus).toEqual(expect.arrayContaining(['yet_to_start', 'triggered']));
});

  
  test('POST /ingest returns ingestion_id', async () => {
    const response = await request(index)
      .post('/ingest')
      .send({
        ids: [1, 2, 3, 4, 5],
        priority: 'MEDIUM'
      })
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('ingestion_id');
    expect(typeof response.body.ingestion_id).toBe('string');
  });

  test('GET /status/:ingestion_id returns correct structure', async () => {
    // First create ingestion
    const postResponse = await request(index)
      .post('/ingest')
      .send({
        ids: [10, 20, 30],
        priority: 'HIGH'
      })
      .set('Accept', 'application/json');
    
    const ingestionId = postResponse.body.ingestion_id;

    // Then get status
    const statusResponse = await request(index)
      .get(`/status/${ingestionId}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toHaveProperty('ingestion_id', ingestionId);
    expect(statusResponse.body).toHaveProperty('status');
    expect(Array.isArray(statusResponse.body.batches)).toBe(true);
  });

});
