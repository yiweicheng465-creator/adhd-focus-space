import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS \`tasks\` (
    \`id\` varchar(36) NOT NULL,
    \`userId\` int NOT NULL,
    \`text\` text NOT NULL,
    \`priority\` enum('focus','urgent','normal') NOT NULL DEFAULT 'normal',
    \`context\` varchar(64) NOT NULL DEFAULT 'personal',
    \`done\` boolean NOT NULL DEFAULT false,
    \`goalId\` varchar(36),
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`wins\` (
    \`id\` varchar(36) NOT NULL,
    \`userId\` int NOT NULL,
    \`text\` text NOT NULL,
    \`iconIdx\` int NOT NULL DEFAULT 0,
    \`archived\` boolean NOT NULL DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`goals\` (
    \`id\` varchar(36) NOT NULL,
    \`userId\` int NOT NULL,
    \`text\` text NOT NULL,
    \`progress\` float NOT NULL DEFAULT 0,
    \`context\` varchar(64) NOT NULL DEFAULT 'personal',
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`brain_dump_entries\` (
    \`id\` varchar(36) NOT NULL,
    \`userId\` int NOT NULL,
    \`text\` text NOT NULL,
    \`tags\` text NOT NULL,
    \`converted\` boolean NOT NULL DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`daily_logs\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`dateKey\` varchar(32) NOT NULL,
    \`wrapUpDone\` boolean NOT NULL DEFAULT false,
    \`dumpCount\` int NOT NULL DEFAULT 0,
    \`winsCount\` int NOT NULL DEFAULT 0,
    \`tasksCompleted\` int NOT NULL DEFAULT 0,
    \`mood\` int,
    \`score\` int NOT NULL DEFAULT 0,
    \`focusSessions\` int NOT NULL DEFAULT 0,
    \`blocksCompleted\` int NOT NULL DEFAULT 0,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`focus_sessions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`sessionNumber\` int NOT NULL,
    \`duration\` int NOT NULL,
    \`dateKey\` varchar(32) NOT NULL,
    \`completedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
];

try {
  for (const sql of statements) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)?.[1];
    await conn.query(sql);
    console.log(`✓ Created table: ${tableName}`);
  }
  const [rows] = await conn.query('SHOW TABLES');
  console.log('\nAll tables:', rows.map(r => Object.values(r)[0]));
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
