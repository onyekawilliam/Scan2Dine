// One definition of the order statuses so every screen words and colours them the same way.
export const ORDER_STATUS = {
  pending: { label: 'New', badge: 'badge-pending', next: 'accepted', action: 'Accept order' },
  accepted: { label: 'Accepted', badge: 'badge-accepted', next: 'preparing', action: 'Start preparing' },
  preparing: { label: 'Preparing', badge: 'badge-preparing', next: 'ready', action: 'Mark ready' },
  ready: { label: 'Ready', badge: 'badge-ready', next: 'completed', action: 'Complete order' },
  completed: { label: 'Completed', badge: 'badge-completed', next: null, action: null },
  cancelled: { label: 'Cancelled', badge: 'badge-cancelled', next: null, action: null },
};

export const statusInfo = (status) => ORDER_STATUS[status] || { label: status, badge: 'badge-neutral', next: null, action: null };

// Orders staff still have to work on.
export const isActiveStatus = (status) => !['completed', 'cancelled'].includes(status);
