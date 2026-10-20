import { readFile } from "fs/promises";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";
import * as z from "zod/v4";

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  repository: z.url(),
  contributionGuidelines: z.url(),
  forks: z.int().nonnegative(),
  stars: z.int().nonnegative(),
  supportChannels: z.url(),
});

const seedSchema = z.object({
  projects: z.array(projectSchema),
});

export type InnerSourceProject = z.infer<typeof projectSchema>;

const DATABASE_PATH = fileURLToPath(new URL("../data/projects.db", import.meta.url));
const SEED_PATH = new URL("../data/projects.yaml", import.meta.url);

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS projects (
    name TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    repository TEXT NOT NULL,
    contributionGuidelines TEXT NOT NULL,
    forks INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    supportChannels TEXT NOT NULL
  )
`;

const INSERT_PROJECT = `
  INSERT INTO projects
    (name, description, repository, contributionGuidelines, forks, stars, supportChannels)
  VALUES
    (?, ?, ?, ?, ?, ?, ?)
`;

const SELECT_PROJECTS = `
  SELECT name, description, repository, contributionGuidelines, forks, stars, supportChannels
  FROM projects
`;

let databasePromise: Promise<DatabaseSync> | undefined;

async function seedFromYaml(database: DatabaseSync): Promise<void> {
  const { projects } = seedSchema.parse(parse(await readFile(SEED_PATH, "utf8")));
  const insert = database.prepare(INSERT_PROJECT);

  database.exec("BEGIN");
  try {
    for (const project of projects) {
      insert.run(
        project.name,
        project.description,
        project.repository,
        project.contributionGuidelines,
        project.forks,
        project.stars,
        project.supportChannels,
      );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

async function initialiseDatabase(): Promise<DatabaseSync> {
  const database = new DatabaseSync(DATABASE_PATH);
  database.exec(CREATE_TABLE);

  const { count } = database.prepare("SELECT COUNT(*) AS count FROM projects").get() as {
    count: number;
  };
  if (count === 0) {
    await seedFromYaml(database);
  }

  return database;
}

/** Opened once per process and shared by every server instance. */
function getDatabase(): Promise<DatabaseSync> {
  databasePromise ??= initialiseDatabase();
  return databasePromise;
}

export async function readProjects(): Promise<InnerSourceProject[]> {
  const database = await getDatabase();
  return z.array(projectSchema).parse(database.prepare(SELECT_PROJECTS).all());
}
