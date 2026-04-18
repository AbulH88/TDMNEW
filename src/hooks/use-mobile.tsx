import { useState, useEffect } from "react";

// simple hook to check if we are on a mobile screen
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(function() {
    // check the screen size
    function checkSize() {
      setIsMobile(window.innerWidth < 768);
    }
    
    // listen for resize events
    window.addEventListener("resize", checkSize);
    
    // run initial check
    checkSize();
    
    return function() {
        window.removeEventListener("resize", checkSize);
    };
  }, []);

  return isMobile;
}
