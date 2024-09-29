import { useState, useEffect, useRef } from 'react';

const useTrackWidth = () => {
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const updateTrackWidth = () => {
      if (trackRef.current) {
        const width = trackRef.current.getBoundingClientRect().width;
        setTrackWidth(Math.round(width));
      }
    };

    // Initial width calculation
    updateTrackWidth();

    // Listen for window resize
    window.addEventListener('resize', updateTrackWidth);

    return () => {
      window.removeEventListener('resize', updateTrackWidth);
    };
  }, []);

  return [trackWidth, trackRef];
};

export default useTrackWidth;
