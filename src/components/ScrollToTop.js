import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // This resets the scroll to the very top (0,0) whenever the path changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use "instant" to prevent a weird sliding effect during page transitions
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;