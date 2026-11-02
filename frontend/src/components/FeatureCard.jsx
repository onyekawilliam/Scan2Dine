import React from 'react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="card card-pad">
    <div className="mb-4 grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
      <Icon size={20} aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
  </div>
);

export default FeatureCard;
