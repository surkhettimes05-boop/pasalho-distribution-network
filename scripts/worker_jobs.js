const { pool } = require('../lib/db');

async function processOrderJob(data) {
  // Example processing: mark order as 'processing' then 'completed'
  try {
    const { orderId } = data;
    await pool.query('UPDATE "Order" SET status = $1 WHERE id = $2', ['processing', orderId]);
    // simulate processing work
    await new Promise(r => setTimeout(r, 500));
    await pool.query('UPDATE "Order" SET status = $1 WHERE id = $2', ['completed', orderId]);
    console.log('Processed order', orderId);
  } catch (err) {
    console.error('processOrderJob error', err);
    throw err;
  }
}

module.exports = { processOrderJob };
