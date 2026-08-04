import nock from "nock";
import myProbotApp from "../src/index.js";
import { evaluateCompliance, renderComplianceReport } from "../src/compliance.js";
import { Probot, ProbotOctokit } from "probot";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, beforeEach, afterEach, test, expect } from "vitest";
import payload from "./fixtures/push.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

describe("Compliance report", () => {
  test("marks non-compliant repositories with the expected findings", () => {
    const report = evaluateCompliance(
      {
        name: "boditor",
        scripts: {
          preinstall: "npm run check",
        },
        dependencies: {
          probot: "^14.3.2",
        },
        devDependencies: {
          "@CHANGEME/check-project": "^1.0.0",
        },
      },
      false,
    );

    expect(report.conclusion).toBe("failure");

    const markdown = renderComplianceReport(report, {
      owner: "hiimbex",
      repo: "testing-things",
      sha: "abc123def456",
    });

    expect(markdown).toContain("Intégration de check-project");
    expect(markdown).toContain("Versions fixes des dépendances");
    expect(markdown).toContain("Commit du package-lock.json");
    expect(markdown).toContain("Scope @CHANGEME");
  });
});

describe("My Probot app", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      Octokit: ProbotOctokit.defaults((instanceOptions: {}) => ({
        ...instanceOptions,
        retry: { enabled: false },
        throttle: { enabled: false },
      })),
    });
    probot.load(myProbotApp);
  });

  test("creates a markdown check run when a push is received", async () => {
    const packageJson = {
      name: "@CHANGEME/testing-things",
      scripts: {
        preinstall: "check",
      },
      dependencies: {
        probot: "14.3.2",
      },
      devDependencies: {
        "@CHANGEME/check-project": "1.0.0",
      },
    };

    const mock = nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          checks: "write",
          contents: "read",
        },
      })
      .get("/repos/hiimbex/testing-things/contents/package.json")
      .query({ ref: "abc123def456" })
      .reply(200, {
        type: "file",
        encoding: "base64",
        content: Buffer.from(JSON.stringify(packageJson), "utf-8").toString("base64"),
      })
      .get("/repos/hiimbex/testing-things/contents/package-lock.json")
      .query({ ref: "abc123def456" })
      .reply(200, {
        type: "file",
        encoding: "base64",
        content: Buffer.from("{}", "utf-8").toString("base64"),
      })
      .post("/repos/hiimbex/testing-things/check-runs", (body: any) => {
        expect(body).toMatchObject({
          name: "Conformité du dépôt",
          head_sha: "abc123def456",
          status: "completed",
          conclusion: "success",
        });

        expect(body.output.summary).toContain("Aucune non-conformité détectée.");
        return true;
      })
      .reply(200);

    await probot.receive({ name: "push", payload });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
