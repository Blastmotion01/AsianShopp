/**
 * Create or promote an admin and (re)set their password.
 *   npm run admin:create                       → uses ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env
 *   npm run admin:create -- me@shop.ua 'S3cret-pass' "Anton"
 * The password is never stored in source code; only its bcrypt hash goes to the DB.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLE_PERMISSIONS } from "../src/lib/auth/permissions";

const db = new PrismaClient();

async function main() {
  const [argEmail, argPassword, argName] = process.argv.slice(2);
  const email = (argEmail ?? process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  const password = argPassword ?? process.env.ADMIN_PASSWORD ?? "";
  const name = argName ?? process.env.ADMIN_NAME ?? "Admin";
  if (!email || !password) throw new Error("Provide ADMIN_EMAIL and ADMIN_PASSWORD (env or arguments).");
  if (password.length < 10) throw new Error("Admin password must be at least 10 characters.");

  const role = await db.role.upsert({
    where: { key: "ADMIN" },
    update: {},
    create: { key: "ADMIN", name: "Admin", permissions: DEFAULT_ROLE_PERMISSIONS.ADMIN },
  });
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { roleId: role.id, passwordHash },
    create: { email, passwordHash, firstName: name, roleId: role.id },
  });
  // Sign out existing sessions of this account after a password change.
  await db.session.deleteMany({ where: { user: { email } } });
  console.log(`✓ Admin ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
