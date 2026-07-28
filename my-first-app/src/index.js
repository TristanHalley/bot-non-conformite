import {evaluateCompliance, renderComplianceReport} from "./compliance.js";
import { Octokit } from "@octokit/rest";

const auth = new Octokit({
    auth: "mypersonalaccesstoken123",
});
// sends request with `Authorization: token mypersonalaccesstoken123` header
const { data } = await octokit.request("/user");

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
            const repo = context.payload.repository;
            const branch = repo?.default_branch;
            let headSha = context.payload.after || context.payload.pull_request?.head?.sha;
            if (!headSha && branch) {
                const br = await context.octokit.rest.repos.getBranch(context.repo({branch}));
                headSha = br.data.commit.sha;
            }
            if (headSha) {
                await context.octokit.rest.checks.create(context.repo({
                    name: "Conformité du dépôt",
                    head_sha: headSha,
                    status: "completed",
                    conclusion: "failure",
                    output: {
                        title: "Permissions manquantes",
                        summary: "L'App n'a pas la permission contents: read ou n'est pas installée sur ce dépôt."
                    }
                }));
            } else {
                await context.octokit.rest.issues.createComment(context.repo({
                    issue_number: context.payload.issue.number,
                    body: "L'App n'a pas la permission contents: read ou n'est pas installée sur ce dépôt."
                }));
            }
            const sha = context.payload.after || context.payload.pull_request?.head?.sha || context.payload.issue?.pull_request?.head?.sha;
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
        }
    );
};
