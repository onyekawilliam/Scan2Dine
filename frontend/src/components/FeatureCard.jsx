import React from 'react';

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <div 
      className="bg-white/80 backdrop-blur-xl p-8 rounded-[30px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 hover:shadow-[0_20px_40px_rgb(99,102,241,0.1)] transition-all duration-300 hover:-translate-y-1 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
