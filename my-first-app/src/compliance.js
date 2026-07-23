const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const RULES = [
  {
    id: "check-project",
    label: "Intégration de check-project",
  },
  {
    id: "fixed-versions",
    label: "Versions fixes des dépendances",
  },
  {
    id: "package-lock",
    label: "Commit du package-lock.json",
  },
  {
    id: "scope",
    label: "Scope @CHANGEME",
  },
];

function formatPath(pathSegments) {
  return pathSegments.join(".");
}

function collectVersionViolations(value, pathSegments, violations) {
  if (typeof value === "string") {
    if (/[~^]/.test(value)) {
      violations.push({
        path: formatPath(pathSegments),
        value,
      });
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    collectVersionViolations(nestedValue, [...pathSegments, key], violations);
  }
}

function summarizeViolations(violations) {
  return violations.map((violation) => `\`${violation.path}\` = \`${violation.value}\``).join("; ");
}

function dependencyVersionViolations(packageJson) {
  const violations = [];

  for (const field of DEPENDENCY_FIELDS) {
    if (packageJson[field]) {
      collectVersionViolations(packageJson[field], [field], violations);
    }
  }

  return violations;
}

export function evaluateCompliance(packageJson, hasPackageLock) {
  if (!packageJson) {
    return {
      conclusion: "failure",
      rows: RULES.map((rule) => ({
        ...rule,
        ok: false,
        detail: "package.json introuvable ou invalide.",
      })),
    };
  }

  const checkProjectDependency = packageJson.devDependencies?.["@CHANGEME/check-project"];
  const preinstallScript = packageJson.scripts?.preinstall;
  const pinnedVersionViolations = dependencyVersionViolations(packageJson);
  const scopedName = typeof packageJson.name === "string" && packageJson.name.startsWith("@CHANGEME/");

  const rows = [
    {
      id: "check-project",
      label: "Intégration de check-project",
      ok: Boolean(checkProjectDependency) && typeof preinstallScript === "string" && preinstallScript.trim().startsWith("check"),
      detail: Boolean(checkProjectDependency) && typeof preinstallScript === "string" && preinstallScript.trim().startsWith("check")
        ? `devDependency détectée et script preinstall configuré sur \`${preinstallScript.trim()}\`.`
        : `devDependency \`@CHANGEME/check-project\` ${checkProjectDependency ? "détectée" : "absente"} et preinstall ${typeof preinstallScript === "string" ? `défini sur \`${preinstallScript}\`` : "manquant"}.`,
    },
    {
      id: "fixed-versions",
      label: "Versions fixes des dépendances",
      ok: pinnedVersionViolations.length === 0,
      detail: pinnedVersionViolations.length === 0
        ? "Aucun opérateur `^` ou `~` détecté dans les champs de dépendances."
        : `Versions non pinées trouvées dans ${summarizeViolations(pinnedVersionViolations)}.`,
    },
    {
      id: "package-lock",
      label: "Commit du package-lock.json",
      ok: hasPackageLock,
      detail: hasPackageLock ? "package-lock.json présent dans le dépôt." : "package-lock.json introuvable à la racine du dépôt.",
    },
    {
      id: "scope",
      label: "Scope @CHANGEME",
      ok: scopedName,
      detail: scopedName
        ? `Le package est nommé \`${packageJson.name}\`.`
        : `Le nom du package ${typeof packageJson.name === "string" ? `\`${packageJson.name}\`` : "est manquant"} doit commencer par \`@CHANGEME/\`.`,
    },
  ];

  return {
    conclusion: rows.every((row) => row.ok) ? "success" : "failure",
    rows,
  };
}

function escapeMarkdown(value) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function renderComplianceReport(report, repository) {
  const lines = [
    "# Rapport de conformité",
    "",
    `**Dépôt** : \`${repository.owner}/${repository.repo}\``,
    `**SHA** : \`${repository.sha}\``,
    "",
    "| Règle | Statut | Détail |",
    "| --- | --- | --- |",
  ];

  for (const row of report.rows) {
    lines.push(
      `| ${row.label} | ${row.ok ? "✅ Conforme" : "❌ Non conforme"} | ${escapeMarkdown(row.detail)} |`,
    );
  }

  const failingRows = report.rows.filter((row) => !row.ok);
  lines.push("");
  lines.push(`## Résultat`);
  if (failingRows.length === 0) {
    lines.push("Aucune non-conformité détectée.");
  } else {
    lines.push("Non-conformités détectées :");
    for (const row of failingRows) {
      lines.push(`- **${row.label}** : ${row.detail}`);
    }
  }

  return lines.join("\n");
}
