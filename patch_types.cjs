const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const targetStats = `export interface AdminOverviewStats {
  totalSessions: number;
  unreadSessions: number;
  ordersCaptured: number;
  totalProducts: number;
  knowledgeSourcesCount: number;
  lastTrainedAt: string;
  aiMode: string;
  twoFactorEnabled?: boolean;
}`;

const newStats = `export interface AdminOverviewStats {
  totalSessions: number;
  unreadSessions: number;
  ordersCaptured: number;
  totalProducts: number;
  knowledgeSourcesCount: number;
  lastTrainedAt: string;
  trainingVersion?: number;
  aiMode?: string;
  twoFactorEnabled?: boolean;
}`;

if (code.includes(targetStats)) {
  code = code.replace(targetStats, newStats);
  fs.writeFileSync('src/types.ts', code);
  console.log('Patched types');
} else {
  console.log('Could not find stats interface.');
}
