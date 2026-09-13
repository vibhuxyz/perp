export const PRESET_AMOUNTS = ['1000', '5000', '10000', '50000'];

export interface RecentPayment {
  id: string;
  date: string;
  title: string;
  amount: string;
  status: string;
  ref: string;
}

export const INITIAL_RECENT_PAYMENTS: RecentPayment[] = [
  {
    id: 'p-1',
    date: 'Sep 13, 06:30 AM',
    title: 'Free Practice Faucet Refill',
    amount: '+$10,000.00',
    status: 'Completed',
    ref: 'TX-SIM-98214',
  },
  {
    id: 'p-2',
    date: 'Sep 12, 09:30 PM',
    title: 'Virtual On-ramp Deposit',
    amount: '+$10,000.00',
    status: 'Completed',
    ref: 'TX-SIM-97120',
  },
  {
    id: 'p-3',
    date: 'Sep 12, 02:00 PM',
    title: 'Welcome Practice Bonus',
    amount: '+$10,000.00',
    status: 'Completed',
    ref: 'TX-SIM-95001',
  },
  {
    id: 'p-4',
    date: 'Sep 11, 08:45 PM',
    title: 'Quick Practice Refill',
    amount: '+$5,000.00',
    status: 'Completed',
    ref: 'TX-SIM-94182',
  },
  {
    id: 'p-5',
    date: 'Sep 11, 10:15 AM',
    title: 'Simulator Faucet Credit',
    amount: '+$1,000.00',
    status: 'Completed',
    ref: 'TX-SIM-93040',
  },
];
