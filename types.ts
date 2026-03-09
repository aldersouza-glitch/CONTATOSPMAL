
// Import React to provide the React namespace for ReactNode type
import React from 'react';

export interface Officer {
  id: string;
  unit: string;
  rank: string;
  matricula?: string;
  name: string;
  contact: string;
  category: string;
  role?: string;
  updated_at?: string;
}

export interface CategoryGroup {
  id: string;
  label: string;
  icon?: React.ReactNode;
}
