import { NextResponse, type NextRequest } from 'next/server';
import { parseOrderFilters, PAYMENT_LABEL, SOURCE_LABEL, STATUS_LABEL, type OrderSource, type OrderStatus, type PaymentStatus } from '@/lib/admin/orders';
import { toCsv } from '@/lib/admin/stats';
import { getStaff } from '@/lib/auth/dal';
import { listOrdersForExport } from '@/lib/data/admin';

const stamp = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Beirut' });

/** Orders matching the list filters as a CSV download (staff only). */
export async function GET(request: NextRequest) {
  const staff = await getStaff();
  if (!staff) {
    const login = new URL('/admin/login', request.url);
    login.searchParams.set('next', '/admin/orders');
    return NextResponse.redirect(login);
  }
  const filters = parseOrderFilters(Object.fromEntries(request.nextUrl.searchParams));
  const orders = await listOrdersForExport(filters);
  const rows = [
    ['Order', 'Date (Beirut)', 'Status', 'Payment', 'Channel', 'Name', 'Email', 'Phone', 'Governorate', 'Area', 'Street', 'Subtotal', 'Discount', 'Discount code', 'Delivery', 'Total'],
    ...orders.map((o) => [
      o.number,
      stamp.format(new Date(o.createdAt)),
      STATUS_LABEL[o.status as OrderStatus] ?? o.status,
      PAYMENT_LABEL[o.paymentStatus as PaymentStatus] ?? o.paymentStatus,
      SOURCE_LABEL[o.source as OrderSource] ?? o.source,
      o.name,
      o.email,
      o.phone,
      o.address.governorate ?? '',
      o.address.area ?? '',
      o.address.street ?? '',
      o.subtotal,
      o.discountTotal,
      o.discountCode ?? '',
      o.shippingTotal,
      o.total,
    ]),
  ];
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(new Date());
  // BOM so Excel opens the file as UTF-8 (Arabic names stay readable).
  return new NextResponse(`﻿${toCsv(rows)}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mago-orders-${today}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
