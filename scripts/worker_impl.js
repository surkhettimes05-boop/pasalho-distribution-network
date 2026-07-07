const { startOrderWorker } = require('../lib/queue');
const { processOrderJob } = require('./worker_jobs');

const { pool } = require('../lib/db');

function startWorker() {
  console.log('Starting order worker...');
  startOrderWorker(async job => {
    console.log('Processing job', job.id, job.name);
    await processOrderJob(job.data);
  }).on('completed', (job) => {
    console.log('Job completed', job.id);
  }).on('failed', (job, err) => {
    console.error('Job failed', job.id, err);
  });

  // Refresh materialized views every 1 hour (3600000 ms)
  setInterval(async () => {
    try {
      console.log('Refreshing materialized views...');
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_view;');
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY top_products_view;');
      console.log('Materialized views refreshed.');
    } catch (err) {
      console.error('Failed to refresh materialized views:', err);
    }
  }, 60 * 60 * 1000);
}

module.exports = { startWorker };
