import { evaluateCompliance, renderComplianceReport } from "./compliance.js";

async function loadJsonFile(context, path, ref) {
  try {
    const response = await context.octokit.rest.repos.getContent(
      context.repo({
        path,
        ref,
      }),
    );

    if (Array.isArray(response.data)) {
      return null;
    }

    return Buffer.from(response.data.content, response.data.encoding || "base64").toString("utf-8");
  } catch (error) {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }
}

export default (app) => {
  app.on("issues.opened", async (context) => {
    const sha = context.payload.after;
    const packageJsonText = await loadJsonFile(context, "package.json", sha);
    let packageJson = null;

    if (packageJsonText) {
      try {
        packageJson = JSON.parse(packageJsonText);
      } catch {
        packageJson = null;
      }
    }

    const packageLockText = await loadJsonFile(context, "package-lock.json", sha);
    const report = evaluateCompliance(packageJson, Boolean(packageLockText));

    await context.octokit.rest.checks.create(
      context.repo({
        name: "Conformité du dépôt",
        head_sha: sha,
        status: "completed",
        conclusion: report.conclusion,
        output: {
          title: "Rapport de conformité Markdown",
          summary: renderComplianceReport(report, {
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            sha,
          }),
        },
      }),
    );
  });
};
