import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      {/* Offset for fixed navbar height */}
      <div style={{ flex: 1, paddingTop: '80px', backgroundColor: 'var(--bg-primary)' }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
