// test.js

const axios = require('axios');

async function test() {
  const url = 'http://localhost:5000';

  try {
    const req1 = await axios.post(`${url}/ingest`, {
      ids: [1, 2, 3, 4, 5],
      priority: "MEDIUM"
    });
    console.log("Request 1:", req1.data);

    setTimeout(async () => {
      try {
        const req2 = await axios.post(`${url}/ingest`, {
          ids: [6, 7, 8, 9],
          priority: "HIGH"
        });
        console.log("Request 2:", req2.data);
      } catch (err) {
        console.error("Error in Request 2:", err.message);
      }
    }, 4000);

    setTimeout(async () => {
      try {
        const res1 = await axios.get(`${url}/status/${req1.data.ingestion_id}`);
        console.log("Status 1:", res1.data);
      } catch (err) {
        console.error("Error in Status 1:", err.message);
      }
    }, 16000);
    
  } catch (err) {
    console.error("Error in Request 1:", err.message);
  }
}

test();
