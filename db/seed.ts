import argon2 from "argon2";
import pool from "#database/pool";
import { formatMobileNumber } from "#utils/formatMobileNumber";

type SeedUser = {
  name: string;
  mobileNumber: string;
  mpin: string;
  dailyLimit: number; // centavos
  monthlyLimit: number; // centavos
};

const SEED_USERS: SeedUser[] = [
  {
    name: "Alice Santos",
    mobileNumber: "639000000001",
    mpin: "1111",
    dailyLimit: 50_000_00,
    monthlyLimit: 500_000_00,
  },
  {
    name: "Bob Reyes",
    mobileNumber: "639000000002",
    mpin: "2222",
    dailyLimit: 50_000_00,
    monthlyLimit: 500_000_00,
  },
  {
    name: "Alice Santos",
    mobileNumber: "639000000003",
    mpin: "3333",
    dailyLimit: 50_000_00,
    monthlyLimit: 500_000_00,
  },
  {
    name: "Bob Reyes",
    mobileNumber: "639000000004",
    mpin: "4444",
    dailyLimit: 50_000_00,
    monthlyLimit: 500_000_00,
  },
];

async function upsertUser(user: SeedUser): Promise<string> {
  const mpinHash = await argon2.hash(user.mpin);
  const msisdn = formatMobileNumber(user.mobileNumber);

  const { rows } = await pool.query(
    `INSERT INTO users (mobile_number, name, mpin_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (mobile_number)
       DO UPDATE SET name = EXCLUDED.name, mpin_hash = EXCLUDED.mpin_hash
     RETURNING id`,
    [msisdn, user.name, mpinHash],
  );

  return rows[0].id;
}

async function upsertLimits(userId: string, user: SeedUser): Promise<void> {
  await pool.query(
    `INSERT INTO transfer_limits (user_id, daily_limit, monthly_limit)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
       DO UPDATE SET daily_limit   = EXCLUDED.daily_limit,
                     monthly_limit = EXCLUDED.monthly_limit`,
    [userId, user.dailyLimit, user.monthlyLimit],
  );
}

async function seed(): Promise<void> {
  const ids: string[] = [];

  for (const user of SEED_USERS) {
    const id = await upsertUser(user);
    await upsertLimits(id, user);
    ids.push(id);
  }

  console.info(`[INFO] Seeded ${SEED_USERS.length} users`);
  for (const user of SEED_USERS) {
    console.info(`[INFO]   ${user.mobileNumber} / mpin ${user.mpin}`);
  }
}

seed()
  .catch((error) => {
    console.error("[ERROR] Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
