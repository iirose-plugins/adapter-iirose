export const CHANGELOG_URL = 'https://iirose.com/lib/php/function/changes.php';

export interface ChangelogEntry
{
  version: string;
  changes: string[];
}

export interface ChangelogData
{
  latest: string;
  versions: ChangelogEntry[];
}

/**
 * 解析 IIROSE 版本更新日志文本
 * 兼容带 # / 不带 # 的版本号，并处理缩进不一致的多行条目
 */
export function parseChangelog(raw: string): ChangelogData | null
{
  const versions: ChangelogEntry[] = [];
  let version = '';
  let changes: string[] = [];
  let currentChange: string | null = null;

  const pushCurrentChange = () =>
  {
    if (currentChange !== null)
    {
      changes.push(currentChange);
      currentChange = null;
    }
  };

  const pushVersion = () =>
  {
    pushCurrentChange();
    if (version && changes.length > 0)
    {
      versions.push({ version, changes });
    }
    version = '';
    changes = [];
  };

  for (const rawLine of raw.split(/\r?\n/))
  {
    const line = rawLine.trim();
    if (!line) continue;

    const versionMatch = /^#?\s*(\d+)\s*$/.exec(line);
    if (versionMatch)
    {
      pushVersion();
      version = versionMatch[1];
      continue;
    }

    if (line.startsWith('●'))
    {
      pushCurrentChange();
      currentChange = line.substring(1).trim();
      continue;
    }

    // 无 ● 的续行归入上一条变更；没有上一条时作为当前版本的变更行
    if (currentChange !== null)
    {
      currentChange += `\n${line}`;
    } else if (version)
    {
      currentChange = line;
    }
  }

  pushVersion();
  if (versions.length === 0) return null;

  return {
    latest: versions[versions.length - 1].version,
    versions,
  };
}
