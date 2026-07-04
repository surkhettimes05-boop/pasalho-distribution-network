import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';
import { isAdminRep } from '@/lib/admin';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!isAdminRep(current)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all orders with retailer, sales rep, and item details
    const result = await pool.query(`
      SELECT 
        o.id as "orderId",
        o.status,
        o."paymentStatus",
        o."createdAt",
        o."updatedAt",
        r.name as "retailerName",
        r.location as "retailerLocation",
        r.phone as "retailerPhone",
        s.name as "repName",
        s.email as "repEmail",
        p.name as "productName",
        p.price as "productPrice",
        p.unit as "productUnit",
        oi.quantity
      FROM "Order" o
      JOIN "Retailer" r ON o."retailerId" = r.id
      LEFT JOIN "SalesRep" s ON o."repId" = s.id
      LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON oi."productId" = p.id
      ORDER BY o."createdAt" DESC, o.id, p.name
    `);

    const rows = result.rows;

    // Build Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pasalho DNP';
    workbook.created = new Date();

    // ──────────────────────────────────────────────
    // SHEET 1: All Orders (one row per order-item)
    // ──────────────────────────────────────────────
    const sheet = workbook.addWorksheet('All Orders', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 10 },
      { header: 'Order Date', key: 'createdAt', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Payment', key: 'paymentStatus', width: 14 },
      { header: 'Sales Rep', key: 'repName', width: 20 },
      { header: 'Rep Email', key: 'repEmail', width: 24 },
      { header: 'Retailer (Shop)', key: 'retailerName', width: 22 },
      { header: 'Shop Location', key: 'retailerLocation', width: 20 },
      { header: 'Shop Phone', key: 'retailerPhone', width: 16 },
      { header: 'Product', key: 'productName', width: 26 },
      { header: 'Unit', key: 'productUnit', width: 10 },
      { header: 'Qty', key: 'quantity', width: 8 },
      { header: 'Unit Price (NPR)', key: 'productPrice', width: 16 },
      { header: 'Line Total (NPR)', key: 'lineTotal', width: 16 },
      { header: 'Last Updated', key: 'updatedAt', width: 20 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    // Add data rows
    for (const row of rows) {
      const lineTotal = (row.quantity || 0) * (row.productPrice || 0);
      const dataRow = sheet.addRow({
        orderId: row.orderId,
        createdAt: row.createdAt ? new Date(row.createdAt).toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' }) : '',
        status: row.status,
        paymentStatus: row.paymentStatus,
        repName: row.repName || 'N/A',
        repEmail: row.repEmail || '',
        retailerName: row.retailerName,
        retailerLocation: row.retailerLocation,
        retailerPhone: row.retailerPhone,
        productName: row.productName || '',
        productUnit: row.productUnit || '',
        quantity: row.quantity || 0,
        productPrice: row.productPrice || 0,
        lineTotal: lineTotal,
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' }) : '',
      });

      // Color-code status
      const statusCell = dataRow.getCell('status');
      const statusVal = (row.status || '').toLowerCase();
      if (statusVal === 'delivered' || statusVal === 'completed') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
      } else if (statusVal === 'pending') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        statusCell.font = { color: { argb: 'FF92400E' }, bold: true };
      } else if (statusVal === 'cancelled' || statusVal === 'canceled') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
      } else if (statusVal === 'processing') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        statusCell.font = { color: { argb: 'FF1E40AF' }, bold: true };
      }

      // Color-code payment
      const payCell = dataRow.getCell('paymentStatus');
      const payVal = (row.paymentStatus || '').toLowerCase();
      if (payVal === 'paid') {
        payCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        payCell.font = { color: { argb: 'FF065F46' }, bold: true };
      } else if (payVal === 'unpaid' || payVal === 'pending') {
        payCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        payCell.font = { color: { argb: 'FF92400E' }, bold: true };
      }
    }

    // Add borders to all cells
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // ──────────────────────────────────────────────
    // SHEET 2: Summary by Status
    // ──────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Summary by Status');
    const statusSummary = await pool.query(`
      SELECT 
        o.status,
        COUNT(DISTINCT o.id) as "orderCount",
        COALESCE(SUM(oi.quantity * p.price), 0) as "totalValue"
      FROM "Order" o
      LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON oi."productId" = p.id
      GROUP BY o.status
      ORDER BY "orderCount" DESC
    `);

    summarySheet.columns = [
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Total Orders', key: 'orderCount', width: 14 },
      { header: 'Total Value (NPR)', key: 'totalValue', width: 20 },
    ];

    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    summaryHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const row of statusSummary.rows) {
      summarySheet.addRow({
        status: row.status,
        orderCount: Number(row.orderCount),
        totalValue: Number(row.totalValue),
      });
    }

    // ──────────────────────────────────────────────
    // SHEET 3: Summary by Sales Rep
    // ──────────────────────────────────────────────
    const repSheet = workbook.addWorksheet('Summary by Sales Rep');
    const repSummary = await pool.query(`
      SELECT 
        COALESCE(s.name, 'Unassigned') as "repName",
        COALESCE(s.email, '') as "repEmail",
        COUNT(DISTINCT o.id) as "orderCount",
        COALESCE(SUM(oi.quantity * p.price), 0) as "totalValue",
        COUNT(DISTINCT CASE WHEN o.status IN ('delivered','completed') THEN o.id END) as "deliveredCount",
        COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as "pendingCount",
        COUNT(DISTINCT CASE WHEN o.status IN ('cancelled','canceled') THEN o.id END) as "cancelledCount"
      FROM "Order" o
      LEFT JOIN "SalesRep" s ON o."repId" = s.id
      LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON oi."productId" = p.id
      GROUP BY s.name, s.email
      ORDER BY "orderCount" DESC
    `);

    repSheet.columns = [
      { header: 'Sales Rep', key: 'repName', width: 22 },
      { header: 'Email', key: 'repEmail', width: 26 },
      { header: 'Total Orders', key: 'orderCount', width: 14 },
      { header: 'Delivered', key: 'deliveredCount', width: 12 },
      { header: 'Pending', key: 'pendingCount', width: 12 },
      { header: 'Cancelled', key: 'cancelledCount', width: 12 },
      { header: 'Total Value (NPR)', key: 'totalValue', width: 20 },
    ];

    const repHeader = repSheet.getRow(1);
    repHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    repHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    repHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const row of repSummary.rows) {
      repSheet.addRow({
        repName: row.repName,
        repEmail: row.repEmail,
        orderCount: Number(row.orderCount),
        deliveredCount: Number(row.deliveredCount),
        pendingCount: Number(row.pendingCount),
        cancelledCount: Number(row.cancelledCount),
        totalValue: Number(row.totalValue),
      });
    }

    // ──────────────────────────────────────────────
    // SHEET 4: Summary by Retailer (Shop)
    // ──────────────────────────────────────────────
    const shopSheet = workbook.addWorksheet('Summary by Shop');
    const shopSummary = await pool.query(`
      SELECT 
        r.name as "retailerName",
        r.location as "retailerLocation",
        r.phone as "retailerPhone",
        COUNT(DISTINCT o.id) as "orderCount",
        COALESCE(SUM(oi.quantity * p.price), 0) as "totalValue",
        COUNT(DISTINCT CASE WHEN o.status IN ('delivered','completed') THEN o.id END) as "deliveredCount",
        COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as "pendingCount",
        COUNT(DISTINCT CASE WHEN o.status IN ('cancelled','canceled') THEN o.id END) as "cancelledCount"
      FROM "Order" o
      JOIN "Retailer" r ON o."retailerId" = r.id
      LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON oi."productId" = p.id
      GROUP BY r.name, r.location, r.phone
      ORDER BY "orderCount" DESC
    `);

    shopSheet.columns = [
      { header: 'Shop Name', key: 'retailerName', width: 24 },
      { header: 'Location', key: 'retailerLocation', width: 20 },
      { header: 'Phone', key: 'retailerPhone', width: 16 },
      { header: 'Total Orders', key: 'orderCount', width: 14 },
      { header: 'Delivered', key: 'deliveredCount', width: 12 },
      { header: 'Pending', key: 'pendingCount', width: 12 },
      { header: 'Cancelled', key: 'cancelledCount', width: 12 },
      { header: 'Total Value (NPR)', key: 'totalValue', width: 20 },
    ];

    const shopHeader = shopSheet.getRow(1);
    shopHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    shopHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    shopHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const row of shopSummary.rows) {
      shopSheet.addRow({
        retailerName: row.retailerName,
        retailerLocation: row.retailerLocation,
        retailerPhone: row.retailerPhone,
        orderCount: Number(row.orderCount),
        deliveredCount: Number(row.deliveredCount),
        pendingCount: Number(row.pendingCount),
        cancelledCount: Number(row.cancelledCount),
        totalValue: Number(row.totalValue),
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const now = new Date().toISOString().slice(0, 10);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pasalho_orders_${now}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
