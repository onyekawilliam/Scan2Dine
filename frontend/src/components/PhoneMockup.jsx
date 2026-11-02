import React from 'react';

// A picture of what guests see on their phone. Purely illustrative, so it is hidden from screen readers.
const DISHES = [
  { name: 'Grilled chicken bowl', price: '$14.50', desc: 'Rice, grilled chicken, greens and house sauce.', icon: '🍗' },
  { name: 'Garden salad', price: '$8.00', desc: 'Seasonal vegetables with a light dressing.', icon: '🥗' },
  { name: 'Chocolate cake', price: '$6.50', desc: 'Rich chocolate with a soft centre.', icon: '🍰' },
];

const PhoneMockup = () => (
  <div className="mx-auto w-[280px]" aria-hidden="true">
    <div className="overflow-hidden rounded-[2.25rem] border-[7px] border-slate-900 bg-white shadow-xl">
      <div className="mx-auto h-5 w-24 rounded-b-xl bg-slate-900" />
      <div className="bg-white px-4 pb-3 pt-3 text-center">
        <p className="text-sm font-semibold text-slate-900">Your restaurant</p>
        <p className="text-[11px] text-slate-500">Sample menu</p>
        <div className="mt-3 flex justify-center gap-1.5">
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-white">All</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">Mains</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">Desserts</span>
        </div>
      </div>

      <div className="space-y-2.5 bg-slate-50 p-3">
        {DISHES.map((dish) => (
          <div key={dish.name} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
            <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-2xl">{dish.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-slate-900">{dish.name}</p>
                <p className="text-[13px] font-semibold text-slate-900">{dish.price}</p>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{dish.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
        <span className="text-xs text-slate-500">2 items · $22.50</span>
        <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">View order</span>
      </div>
    </div>
  </div>
);

export default PhoneMockup;
