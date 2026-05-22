import { Container, getRandom } from "@cloudflare/containers";
import { env as workerEnv } from "cloudflare:workers";

const DEFAULT_INSTANCE_COUNT = 1;
const DEFAULT_PORT = 5000;

const STATIC_CONTAINER_ENV = {
  NODE_ENV: "production",
  PORT: String(DEFAULT_PORT),
};

const CONTAINER_SECRET_NAMES = [
  "pg_master_host",
  "pg_master_port",
  "pg_master_user",
  "pg_master_password",
  "pg_master_database",
] as const;

type ContainerSecretName = (typeof CONTAINER_SECRET_NAMES)[number];
type SecretBindings = Partial<Record<ContainerSecretName, string>>;

export interface Env extends SecretBindings {
  EXPRESSJS_API: DurableObjectNamespace<ExpressjsAPI>;
  CONTAINER_INSTANCE_COUNT?: string;
}

function buildContainerEnv(envSource: SecretBindings): Record<string, string> {
  const containerEnv: Record<string, string> = { ...STATIC_CONTAINER_ENV };

  for (const name of CONTAINER_SECRET_NAMES) {
    const value = envSource[name];

    if (typeof value === "string" && value.length > 0) {
      containerEnv[name] = value;
    }
  }

  return containerEnv;
}

function missingRequiredSecrets(envSource: SecretBindings): ContainerSecretName[] {
  return CONTAINER_SECRET_NAMES.filter((name) => !envSource[name]);
}

function getContainerInstanceCount(envSource: Env): number {
  const configuredCount = Number(envSource.CONTAINER_INSTANCE_COUNT);

  if (Number.isInteger(configuredCount) && configuredCount > 0) {
    return configuredCount;
  }

  return DEFAULT_INSTANCE_COUNT;
}

export class ExpressjsAPI extends Container {
  defaultPort = DEFAULT_PORT;
  requiredPorts = [DEFAULT_PORT];
  sleepAfter = "5m";
  envVars = buildContainerEnv(workerEnv as unknown as SecretBindings);

  override onStart() {
    console.log("ExpressjsAPI container started");
  }

  override onStop({ exitCode, reason }: { exitCode?: number; reason?: string }) {
    console.log("ExpressjsAPI container stopped", { exitCode, reason });
  }

  override onError(error: unknown) {
    console.error("ExpressjsAPI container error", error);
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const missing = missingRequiredSecrets(env);

    if (missing.length > 0) {
      return new Response(`Missing Cloudflare Worker secrets: ${missing.join(", ")}`, {
        status: 500,
      });
    }

    const container = await getRandom(env.EXPRESSJS_API, getContainerInstanceCount(env));

    return container.fetch(request);
  },
};
