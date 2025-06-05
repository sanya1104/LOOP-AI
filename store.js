// store.js

const ingestionMap = new Map(); // ingestionId -> [batchIds]
const batchMap = new Map();     // batchId -> batchObject

module.exports = { ingestionMap, batchMap };
