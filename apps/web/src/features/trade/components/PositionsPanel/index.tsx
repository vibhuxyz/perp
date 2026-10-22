import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPositions, closePosition } from '@/features/trade/api/tradeApi';
import { useMarketStore } from '@/stores/market.store';
import { useAccountStore } from '@/stores/account.store';
import { AuthModal } from '@/features/auth/AuthModal';
import { TabsHeader } from './TabsHeader';
import { SignedOutState } from './SignedOutState';
import { PositionsTable } from './PositionsTable';
import { OpenOrdersTable } from './OpenOrdersTable';
import { FillsTable } from './FillsTable';
import { OrderHistoryTable } from './OrderHistoryTable';
import { PositionHistoryTable } from './PositionHistoryTable';
import { BorrowsView } from './BorrowsView';
import { TwapView } from './TwapView';
import { NoPositionsState } from './EmptyStates';

export function PositionsPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('positions');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const queryClient = useQueryClient();
  const token = useAccountStore(s => s.token);
  const markPrice = useMarketStore(s => s.indexPrice);

  const isAuthenticated = Boolean(token);

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['positions', token],
    queryFn: fetchPositions,
    enabled: isAuthenticated,
    refetchInterval: 2_000,
    retry: false,
  });

  const closeMutation = useMutation({
    mutationFn: (market: string) => closePosition(market),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['equity'] });
      queryClient.invalidateQueries({ queryKey: ['depth'] });
      queryClient.invalidateQueries({ queryKey: ['positionHistory'] });
    },
  });

  const handleOpenAuth = (signUp: boolean) => {
    if (signUp) {
      navigate('/register');
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-col bg-bg-card rounded-xl border border-border-subtle overflow-hidden select-none">
        <TabsHeader activeTab={activeTab} onSelect={setActiveTab} positionsCount={positions.length} />

        {!isAuthenticated ? (
          <SignedOutState onLogin={() => handleOpenAuth(false)} onSignUp={() => handleOpenAuth(true)} />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            {activeTab === 'positions' ? (
              positions.length > 0 ? (
                <PositionsTable
                  positions={positions}
                  markPrice={markPrice}
                  isClosing={closeMutation.isPending}
                  onClose={market => closeMutation.mutate(market)}
                />
              ) : (
                <NoPositionsState isLoading={isLoading} />
              )
            ) : activeTab === 'orders' ? (
              <OpenOrdersTable token={token} />
            ) : activeTab === 'fills' ? (
              <FillsTable token={token} />
            ) : activeTab === 'orderHistory' ? (
              <OrderHistoryTable token={token} />
            ) : activeTab === 'posHistory' ? (
              <PositionHistoryTable token={token} />
            ) : activeTab === 'borrows' ? (
              <BorrowsView token={token} />
            ) : (
              <TwapView />
            )}
          </div>
        )}
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
