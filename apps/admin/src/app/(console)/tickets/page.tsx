import { Suspense } from 'react';
import { LoadingState } from '../../../components/loading-state';
import TicketsPageContent from './tickets-content';

export default function TicketsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading tickets…" />}>
      <TicketsPageContent />
    </Suspense>
  );
}
