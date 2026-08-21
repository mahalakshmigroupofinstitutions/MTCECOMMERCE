/* Creates (or updates the password of) an admin who can review vendor
 * submissions at /admin. There is no admin self-signup by design — run this.
 *
 *   npm run admin:create -- admin@example.com "some-strong-password" "Their Name"
 *
 * Follows prisma/seed.ts's standalone-client pattern: scripts run through tsx
 * can't import the "server-only"-guarded lib/* modules, so this instantiates its
 * own PrismaClient and calls bcryptjs directly. */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function main() {
  const [emailRaw, password, name] = process.argv.slice(2);

  if (!emailRaw || !password) {
    console.error('Usage: npm run admin:create -- <email> <password> ["Name"]');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const email = emailRaw.toLowerCase();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, ...(name ? { name } : {}) },
    create: { email, passwordHash, name: name ?? email.split("@")[0] },
  });

  console.log(`Admin ready: ${admin.email} (${admin.name}) — log in at /admin/login`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
