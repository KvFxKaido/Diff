import { useCallback, useState } from 'react';

export function useExpandable(defaultExpanded = false) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return { expanded, setExpanded, toggleExpanded };
}
