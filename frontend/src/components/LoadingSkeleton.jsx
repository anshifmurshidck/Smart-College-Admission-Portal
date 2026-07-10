import React from 'react';

export function CardSkeleton() {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="skeleton" style={{ height: '16px', width: '40%' }} />
      <div className="skeleton" style={{ height: '36px', width: '70%' }} />
      <div className="skeleton" style={{ height: '12px', width: '90%' }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', padding: '16px' }}>
      {/* Table Headers skeleton */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '24px', flex: 1 }} />
        ))}
      </div>
      {/* Table Rows skeleton */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '16px' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton" style={{ height: '20px', flex: 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-panel" style={{ padding: '24px', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="skeleton" style={{ height: '20px', width: '30%' }} />
      <div style={{ display: 'flex', gap: '20px', height: '200px', alignItems: 'flex-end', padding: '0 20px' }}>
        <div className="skeleton" style={{ height: '40%', flex: 1 }} />
        <div className="skeleton" style={{ height: '80%', flex: 1 }} />
        <div className="skeleton" style={{ height: '60%', flex: 1 }} />
        <div className="skeleton" style={{ height: '90%', flex: 1 }} />
        <div className="skeleton" style={{ height: '50%', flex: 1 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: '12px', width: '15%' }} />
        <div className="skeleton" style={{ height: '12px', width: '15%' }} />
        <div className="skeleton" style={{ height: '12px', width: '15%' }} />
      </div>
    </div>
  );
}
