// DragContext.js
import React, { createContext, useContext, useState } from 'react';

const DragContext = createContext();

export const DragProvider = ({ children }) => {
  const [dragItem, setDragItem] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const updateDragItem = (item) => setDragItem(item);
  const updateDragPosition = (pos) => setDragPosition(pos);

  return (
    <DragContext.Provider value={{ dragItem, dragPosition, updateDragItem, updateDragPosition }}>
      {children}
    </DragContext.Provider>
  );
};

export const useDrag = () => useContext(DragContext);
export default DragProvider;
