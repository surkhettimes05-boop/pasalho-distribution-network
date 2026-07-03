const { startOrderWorker } = require('../lib/queue');
const { processOrderJob } = require('./worker_jobs');

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
}

module.exports = { startWorker };
