import { pool } from './db';

// MOCK QUEUE FOR LOCAL DEV (No Redis required)
export const orderQueue = {
  add: async (jobName: string, data: any) => {
    console.log(`[Queue Mock] Enqueued job: ${jobName} for order ${data.orderId}`);
    
    // Simulate background worker picking it up after 2 seconds
    setTimeout(async () => {
      try {
        console.log(`[Queue Mock Worker] Received job: ${data.orderId}`);
        const { orderId } = data;
        
        await pool.query('UPDATE "Order" SET status = $1 WHERE id = $2', ['processing', orderId]);
        
        // Simulate background work
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await pool.query('UPDATE "Order" SET status = $1 WHERE id = $2', ['completed', orderId]);
        console.log(`[Queue Mock Worker] Finished processing order: ${orderId}`);
      } catch (err) {
        console.error(`[Queue Mock Worker] Job failed: ${data.orderId}`, err);
      }
    }, 2000);
    
    return { id: Math.random().toString(36).substring(7) };
  }
};
