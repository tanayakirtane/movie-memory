// Run only against a disposable database; never defaults to the application's DATABASE_URL.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
if (!process.env.AUDIT_DATABASE_URL)
  throw new Error(
    "Set AUDIT_DATABASE_URL to a disposable PostgreSQL database.",
  );
const options = {
  datasources: { db: { url: process.env.AUDIT_DATABASE_URL } },
};
let db = new PrismaClient(options);
const alice = `audit-${randomUUID()}`;
const bob = `audit-${randomUUID()}`;
try {
  await db.user.create({ data: { id: alice, favoriteMovie: "Interstellar" } });
  await db.user.create({ data: { id: bob, favoriteMovie: "Inception" } });
  await db.movieFact.create({
    data: { userId: alice, movie: "Interstellar", text: "Audit fixture" },
  });
  assert.equal(await db.movieFact.count({ where: { userId: bob } }), 0);
  await db.user.update({
    where: { id: alice },
    data: { favoriteMovie: "Inception" },
  });
  assert.equal(
    (await db.movieFact.findFirst({ where: { userId: alice } })).movie,
    "Interstellar",
  );
  await db.$disconnect();
  db = new PrismaClient(options);
  assert.equal(
    (await db.user.findUnique({ where: { id: alice } })).favoriteMovie,
    "Inception",
  );
  assert.equal(await db.movieFact.count({ where: { userId: alice } }), 1);
  await assert.rejects(
    db.movieFact.create({
      data: {
        userId: `absent-${randomUUID()}`,
        movie: "Inception",
        text: "Invalid FK",
      },
    }),
  );
  await db.user.delete({ where: { id: alice } });
  assert.equal(await db.movieFact.count({ where: { userId: alice } }), 0);
  console.log(
    "PASS: isolation, movie edit, historical attribution, reconnect persistence, FK rejection, cascade deletion",
  );
} finally {
  await db.user.deleteMany({ where: { id: { in: [alice, bob] } } });
  await db.$disconnect();
}
