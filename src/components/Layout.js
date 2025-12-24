import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import FallingEmojis from './FallingEmojis';
import { getFestivalConfig } from '../utils/festivalLogic';

export const Layout = () => {
  // 1. Calculate festival config once when layout loads
  const festivalConfig = useMemo(() => getFestivalConfig(), []);

  return (
    <div className="min-h-screen font-sans text-white bg-brand-dark">
      {/* 2. Global Festival Animation Layer */}
      {festivalConfig && <FallingEmojis config={festivalConfig} />}

      <Header />
      
      <main className="pt-16 pb-24 md:pb-12">
        <Outlet /> {/* This renders your pages (Home, Menu, etc.) */}
      </main>

      <BottomNav />
    </div>
  );
};