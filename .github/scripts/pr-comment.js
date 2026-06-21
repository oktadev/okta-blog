// Called by actions/github-script in the deploy-to-vercel job.
// Required env vars (set by the workflow):
//   PREVIEW_URL, DEPLOYMENT_URL, INSPECT_URL, COMMIT_SHA, RUN_ID
module.exports = async ({ github, context }) => {
  const previewUrl = process.env.PREVIEW_URL;
  const inspectUrl = process.env.INSPECT_URL;
  const sha = process.env.COMMIT_SHA.slice(0, 7);
  const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${process.env.RUN_ID}`;

  const deployLogLine = inspectUrl
    ? `| 🔍 Latest deploy log | [Vercel Dashboard](${inspectUrl}) |`
    : `| 🔍 Latest deploy log | [GitHub Actions](${runUrl}) |`;

  const body = [
    `## ✅ Deploy Preview for **${context.repo.repo}** ready!`,
    '',
    '| | |',
    '|---|---|',
    `| 🔨 Latest commit | \`${sha}\` |`,
    deployLogLine,
    `| 😎 Deploy Preview | ${previewUrl} |`,
  ].join('\n');

  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
  });

  const botComments = comments.filter(
    (c) =>
      c.user.login === 'github-actions[bot]' &&
      (c.body.includes(`Deploy Preview for **${context.repo.repo}**`) ||
        c.body.includes('## Vercel Deployment'))
  );

  // Delete all but the most recent, then update the remaining one
  for (const old of botComments.slice(0, -1)) {
    await github.rest.issues.deleteComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: old.id,
    });
  }
  const existing = botComments.at(-1);

  if (existing) {
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body,
    });
  }
};
