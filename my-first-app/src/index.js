import {evaluateCompliance, renderComplianceReport} from "./compliance.js";
import fs from "node:fs";

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
    // Run on push and daily schedule (schedule.repository). Configure cron in the App settings.
    app.on(["push", "issues.opened", "repository_dispatch"], async (context) => {
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
        console.log(report);
        fs.writeFileSync("report.md", renderComplianceReport(report, {owner: context.payload.repository.owner.login, repo: context.payload.repository.name, sha}));
    });
};
