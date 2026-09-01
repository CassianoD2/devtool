/**
 * Conventional Commits — usado pelo semantic-release para decidir a próxima versão
 * e gerar o CHANGELOG. Validado no CI (job "commitlint") em cada Pull Request.
 *
 *   feat: …      -> minor
 *   fix: …       -> patch
 *   perf: …      -> patch
 *   BREAKING CHANGE: … (no corpo) ou  feat!: …  -> major
 *   chore/docs/refactor/test/ci/build/style: … -> sem release
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
  },
};
