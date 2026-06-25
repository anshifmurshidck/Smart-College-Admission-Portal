import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      {/* Spacer to push content down below sticky transparent navbar */}
      <div style={{ height: '80px', backgroundColor: 'var(--bg-primary)' }} />
      <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)' }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
