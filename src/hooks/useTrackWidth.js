import { useState, useEffect } from 'react';

const useTrackWidth = (trackRef) => {

  const [trackWidth, setTrackWidth] = useState(0);
  const [trackLeft, setTrackLeft] = useState(0);

  useEffect(() => {
    const updateTrackWidth = () => {

      if (trackRef?.current) {

        const width = trackRef.current.getBoundingClientRect().width;
        setTrackWidth(Math.round(width));

        const trackLeft = Math.floor(trackRef.current.getBoundingClientRect().left);
        setTrackLeft(Math.round(trackLeft))
      }
    };

    // Initial width calculation
    updateTrackWidth();

    // Listen for window resize
    window.addEventListener('resize', updateTrackWidth);

    return () => {
      window.removeEventListener('resize', updateTrackWidth);
    };
  }, [trackRef]);

  return [trackWidth, trackLeft];
};

export default useTrackWidth;
