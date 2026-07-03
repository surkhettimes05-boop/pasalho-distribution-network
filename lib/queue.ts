import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';
import { pool } from './db';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const orderQueue = new Queue('orderQueue', { connection });

// Initialize queue scheduler once
if (typeof global !== 'undefined' && !(global as any).queueSchedulerStarted) {
  (global as any).queueSchedulerStarted = true;
  new QueueScheduler('orderQueue', { connection });
}

// Start automated background order worker inside Next.js server process
if (typeof global !== 'undefined' && !(global as any).orderWorkerStarted) {
  (global as any).orderWorkerStarted = true;
  
  console.log('[Queue Worker] Starting background order processor...');
  
  const worker = new Worker(
    'orderQueue',
    async (job) => {
      console.log(`[Queue Worker] Received job: ${job.id} (orderId: ${job.data.orderId})`);
      const { orderId } = job.data;
      
      // Update status to processing
      await pool.query('UPDATE "Order" SET status = $1 WHERE id = $2', ['processing', orderId]);
      
      // Simulate background order fulfillment tasks (e.g. print receipt, notify distributor)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Complete order
      await pool.query('UPDATE "Order" SET status = $1 WHERE id = $2', ['completed', orderId]);
      console.log(`[Queue Worker] Finished processing order: ${orderId}`);
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`[Queue Worker] Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Queue Worker] Job failed: ${job?.id}`, err);
  });
}
