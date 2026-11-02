import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, Receipt, Search } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { downloadCsv, plural } from '../utils/csv';
import { money, errorMessage } from '../utils/format';
import { ORDER_STATUS } from '../constants/orderStatus';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/toastContext';

const PAGE_SIZE = 50;

function AllOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);

  const loadPage = useCallback(async (nextPage) => {
    try {
      const res = await api.get('/orders', { params: { limit: PAGE_SIZE, page: nextPage } });
      if (res.data.success) {
        const { orders: batch, total: count } = res.data.data;
        setOrders((prev) => (nextPage === 1 ? batch : [...prev, ...batch]));
        setTotal(count);
        setPage(nextPage);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load orders.'));
    }
  }, [toast]);

  useEffect(() => {
    loadPage(1).finally(() => setLoading(false));
  }, [loadPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    await loadPage(page + 1);
    setLoadingMore(false);
  };

  const query = search.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      !query ||
      o.order_number.toLowerCase().includes(query) ||
      (o.customer_name || '').toLowerCase().includes(query) ||
      (o.table_number || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Exports exactly what is on screen (current status filter and search).
  const exportCsv = () => {
    downloadCsv(
      `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ['Order', 'Date', 'Customer', 'Table', 'Items', 'Subtotal', 'Tax', 'Total', 'Status'],
      filtered.map((o) => [
        o.order_number,
        format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
        o.customer_name || '',
        o.table_number || '',
        o.items.map((i) => `${i.quantity}x ${i.item_name}`).join('; '),
        o.subtotal.toFixed(2),
        o.tax.toFixed(2),
        o.total.toFixed(2),
        o.status,
      ])
    );
  };

  return (
    <div>
      <PageHeader title="Order history" description="Every order your restaurant has received.">
        <button type="button" onClick={exportCsv} disabled={filtered.length === 0} className="btn btn-secondary">
          <FileText size={16} /> Export CSV
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
            placeholder="Search by order number, name or table"
            className="input pl-10"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="input sm:w-48">
          <option value="all">All statuses</option>
          {Object.entries(ORDER_STATUS).map(([key, info]) => (
            <option key={key} value={key}>{info.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-sm text-slate-500">Loading order history…</p>
        ) : orders.length === 0 ? (
          <EmptyState icon={Receipt} title="No orders yet" description="Orders appear here once guests start ordering from your QR code.">
            <Link to="/dashboard/qr" className="btn btn-primary btn-sm">Get your QR code</Link>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No orders match" description="Try a different search or status.">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear filters</button>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="table-head">
                  <th className="w-10 py-3 pl-4"><span className="sr-only">Details</span></th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const open = openId === order._id;
                  return (
                    <React.Fragment key={order._id}>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 pl-4">
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? null : order._id)}
                            aria-expanded={open}
                            aria-label={`${open ? 'Hide' : 'Show'} details for ${order.order_number}`}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{order.order_number}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{format(new Date(order.createdAt), 'MMM d, h:mm a')}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {order.customer_name || (order.table_number ? `Table ${order.table_number}` : '—')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{plural(order.items.reduce((acc, i) => acc + i.quantity, 0), 'item')}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">{money(order.total)}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      </tr>
                      {open && (
                        <tr className="bg-slate-50">
                          <td />
                          <td colSpan={6} className="px-4 pb-4 pt-1">
                            <ul className="space-y-1 text-slate-700">
                              {order.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between gap-4">
                                  <span>
                                    <span className="mr-2 tabular-nums text-slate-500">{item.quantity}×</span>{item.item_name}
                                    {item.special_instructions && <span className="ml-2 text-xs text-amber-700">({item.special_instructions})</span>}
                                  </span>
                                  <span className="tabular-nums">{money(item.subtotal)}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="mt-2 text-xs text-slate-500">
                              Subtotal {money(order.subtotal)} · Tax {money(order.tax)}
                              {order.table_number ? ` · Table ${order.table_number}` : ''}
                            </p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            <span>Showing {filtered.length} of {total} {total === 1 ? 'order' : 'orders'}</span>
            {orders.length < total && (
              <button type="button" onClick={loadMore} disabled={loadingMore} className="btn btn-secondary btn-sm">
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllOrders;
