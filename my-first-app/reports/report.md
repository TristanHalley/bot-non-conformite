# Rapport de conformité

**Dépôt** : `TristanHalley/bot-non-conformite`
**SHA** : `c06a540a4ca567cadd76a7ec5384cc0063f84b14`

| Règle | Statut | Détail |
| --- | --- | --- |
| Intégration de check-project | ❌ Non conforme | devDependency `@CHANGEME/check-project` absente et preinstall manquant. |
| Versions fixes des dépendances | ❌ Non conforme | Versions non pinées trouvées dans `dependencies.octokit` = `^5.0.5`; `dependencies.probot` = `^14.3.2`; `devDependencies.@types/node` = `^24.0.0`; `devDependencies.ioredis` = `^5.10.1`; `devDependencies.nock` = `^14.0.5`; `devDependencies.smee-client` = `^5.0.0`; `devDependencies.typescript` = `^6.0.3`; `devDependencies.vitest` = `^3.2.4`. |
| Commit du package-lock.json | ✅ Conforme | package-lock.json présent dans le dépôt. |
| Scope @CHANGEME | ❌ Non conforme | Le nom du package `boditor` doit commencer par `@CHANGEME/`. |

## Résultat
Non-conformités détectées :
- **Intégration de check-project** : devDependency `@CHANGEME/check-project` absente et preinstall manquant.
- **Versions fixes des dépendances** : Versions non pinées trouvées dans `dependencies.octokit` = `^5.0.5`; `dependencies.probot` = `^14.3.2`; `devDependencies.@types/node` = `^24.0.0`; `devDependencies.ioredis` = `^5.10.1`; `devDependencies.nock` = `^14.0.5`; `devDependencies.smee-client` = `^5.0.0`; `devDependencies.typescript` = `^6.0.3`; `devDependencies.vitest` = `^3.2.4`.
- **Scope @CHANGEME** : Le nom du package `boditor` doit commencer par `@CHANGEME/`.
