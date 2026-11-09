import React from 'react';
import { SanctuaryLoader } from '@/components/SanctuaryLoader';

export default function ProblemDetailLoading() {
  return (
    <SanctuaryLoader
      title="Retrieving cipher thread..."
      subtitle="Preparing anonymous mask and decrypting peer replies."
    />
  );
}

