import { cac } from "../../deps/cac.ts";
import { loadEnv } from "../../env.ts";
import {
  CloudflareConfig,
  updateDNSLink as cfUpdateDNSLink,
} from "./cloudflare.ts";

await loadEnv();
const cli = cac("dns-link");

cli.command("cloudflare <ipfsPath> <domain>")
  .option("--token <token>", "The token for calling Cloudflare APIs")
  .action(
    async (
      ipfsPath: string,
      domain: string,
      options: CloudflareConfig,
    ) => {
      await cfUpdateDNSLink(domain, ipfsPath, options);
      console.log(domain, "->", ipfsPath);
    },
  );

cli.help();
cli.parse();
