import { cac } from "../../deps/cac.ts";
import {
  CloudflareConfig,
  updateDNSLink as cfUpdateDNSLink,
} from "./cloudflare.ts";

const cli = cac("dns-link");

cli.command("cloudflare <ipfsPath> <domain> [name]")
  .option("--token <token>", "The token for calling Cloudflare APIs")
  .action(
    async (
      ipfsPath: string,
      domain: string,
      name: string,
      options: CloudflareConfig,
    ) => {
      await cfUpdateDNSLink(domain, name, ipfsPath, options);
      console.log([name, domain].filter(Boolean).join("."), "->", ipfsPath);
    },
  );

cli.help();
cli.parse();
