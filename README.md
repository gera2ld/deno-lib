# deno-lib

Handy utilities for Deno.

## Usage

### Logger

```ts
import { logger } from "https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/logger.ts";

logger.info("Great!");
```

### Environment Variables

```ts
import { ensureEnv, ensureEnvs } from "https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/env.ts";

const SOME_ENV = ensureEnv('SOME_ENV');

const { ENV1, ENV2 } = ensureEnvs(['ENV1', 'ENV2']);

// If any of the environment variable is not found, an error occurs.
```

### Database and Storage

- Work with JSON file:

  ```ts
  import { openJSONFile } from "https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/database/file.ts";

  const db = await openJSONFile<Schema>(defaults, filename);

  console.log('All data:', db.data);
  // Make some updates and dump
  db.data.update = true;
  db.dump();
  ```

- Work with storage:

  ```ts
  import { openStorage } from "https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/database/storage.ts";
  import { loadFromEnv } from "https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/storage/index.ts";

  // Load storage from GitHubGist
  Deno.env.set('GIST_ID', GIST_ID);
  Deno.env.set('GIST_OWNER', GIST_OWNER);
  Deno.env.set('GITHUB_PAT', GITHUB_PAT);
  const storage = loadFromEnv('githubGist');
  const db = await openStorage(defaults, storage, filename);

  console.log('All data:', db.data);
  // Make some updates and dump
  db.data.update = true;
  db.dump();
  ```
