This repository is an API serving the backend service.

# Project Setup

1. Clone the repository
2. Copy and paste the _.env.template_ file and rename it to _.env_
3. Fill out the _.env_ file with the correct configuration values
4. Run the command: `npm install`
5. Run the command: `npm update`

### The project is now installed. To start the API locally, simply run:

`npm run dev`

Pending database migrations are applied automatically before the server starts
(the `predev` script runs `npm run db:migrate`), so you don't need to touch the
database by hand. For a production-style run use `npm start`, which migrates and
then runs the compiled server.

You can then access the local API on port 3000:

`http://localhost:3000/`

To access the Swagger API documentation: `http://localhost:3000/api-docs`

## Drizzle ORM

Migrations are applied automatically on startup, so normally you don't need to
run anything manually. When you change `src/db/schema.ts`, generate a new
migration and commit it:

```bash
npm run db:generate   # create a new SQL migration from the schema
npm run db:migrate    # apply pending migrations (also runs automatically on start)
```

`npm run db:push` is also available for throwaway/prototyping databases (applies
the schema directly without a migration file). Prefer `db:generate` +
`db:migrate` for anything shared, since those migrations are committed and run
automatically for everyone.

Make sure that your database user has sufficient privileges. Otherwise, you might encounter an error such as:

```
No config path provided, using default 'drizzle.config.ts'
Reading config file 'D:\dev\Amis-JoterBack\drizzle.config.ts'
Using 'pg' driver for database querying
[✓] Pulling schema from database...
error: permission denied for schema public
```

### How to fix it? Grant usage and permissions to your database user:

```sql
GRANT USAGE ON SCHEMA public TO admin;

GRANT CREATE, CONNECT, TEMPORARY ON DATABASE amisjoter TO username;
GRANT ALL PRIVILEGES ON SCHEMA public TO username;
```
