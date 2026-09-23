This repository is an API serving the backend service.

# Project Setup

1. Clone the repository 
2. Copy and paste the *.env.template* file and rename it to *.env*
3. Fill out the *.env* file with the correct configuration values
4. Run the command: `npm install`
5. Run the command: `npm update`

### The project is now installed. To start the API locally, simply run:

`npm run start`

You may need to install an additional package. You can then access the local API on port 3000:

`http://localhost:3000/`

To access the Swagger API documentation: `http://localhost:3000/api-docs`

## Drizzle ORM

To apply database schema updates:

```ts
npx drizzle-kit push
```

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
