import React from 'react';

const PhoneMockup = () => {
  return (
    <div className="relative mx-auto w-[300px] h-[600px] bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-900 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-32 mx-auto z-20"></div>
      
      {/* Screen Content */}
      <div className="w-full h-full bg-slate-50 flex flex-col relative z-10 overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 pt-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 text-center">Mario's Bistro</h2>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium whitespace-nowrap">Popular</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap">Starters</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap">Mains</span>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 flex-1 space-y-4">
          {[
            { name: "Truffle Pasta", price: "$24", desc: "Handmade pasta with black truffle shavings.", img: "🍝" },
            { name: "Caprese Salad", price: "$12", desc: "Fresh tomatoes, mozzarella, and basil.", img: "🥗" },
            { name: "Tiramisu", price: "$9", desc: "Classic Italian dessert with coffee.", img: "🍰" },
            { name: "Garlic Bread", price: "$6", desc: "Toasted baguette with garlic butter.", img: "🥖" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl shadow-sm flex gap-3 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-3xl shrink-0">
                {item.img}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{item.name}</h3>
                  <span className="font-bold text-primary text-sm">{item.price}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.desc}</p>
                <div className="mt-2 flex justify-end">
                  <button className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors shadow-sm">
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom Bar */}
        <div className="bg-white border-t border-slate-100 p-4 sticky bottom-0 z-10 flex justify-between items-center">
           <div className="text-slate-500 text-sm font-medium">Cart: 0 items</div>
           <button className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">View Cart</button>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
