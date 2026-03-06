import { EventSchemas, Inngest } from 'inngest';

export type PolyPlotEvents = {
  'user/sync.requested': {
    data: {
      userId: string;
      venueId: string;
      walletAddress: string;
    };
  };
  'user/sync.completed': {
    data: {
      userId: string;
      venueId: string;
      newTradeCount: number;
    };
  };
  'market/resolved': {
    data: {
      marketId: string;
      venueMarketId: string;
      venueId: string;
      outcome: string;
      settlementProb: number;
    };
  };
  'decision/created': {
    data: {
      decisionId: string;
      userId: string;
      marketId: string;
      isResolved: boolean;
    };
  };
  'achievement/check': {
    data: {
      userId: string;
      trigger: 'resolution' | 'nightly';
    };
  };
};

export const inngest = new Inngest({
  id: 'polyplot',
  schemas: new EventSchemas().fromRecord<PolyPlotEvents>(),
});
