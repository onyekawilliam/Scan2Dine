import React from 'react';
import { statusInfo } from '../../constants/orderStatus';

export default function StatusBadge({ status }) {
  const info = statusInfo(status);
  return <span className={`badge ${info.badge}`}>{info.label}</span>;
}
