import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import Header from "./Header"; // Import the new Header

export const Layout = () => {
  return (
    <div className="min-h-screen font-sans text-white bg-brand-dark">
      
      {/* Top Navigation */}
      <Header />

      {/* Main Content Area 
          pt-20 adds top padding so content isn't hidden behind the fixed header 
          pb-20 adds bottom padding for the nav bar 
      */}
      <div className="pt-20 pb-20">
        <Outlet />
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};