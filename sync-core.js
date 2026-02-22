const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

// GitHub repo URL (can be customized)
const GITHUB_REPO = 'https://github.com/user/repo';

function getGitInfo(repoPath) {
  try {
    const commitId = execSync('git rev-parse HEAD', {
      cwd: repoPath,
      encoding: 'utf8'
    }).trim();

    const shortCommitId = commitId.substring(0, 7);

    let githubUrl = GITHUB_REPO;
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', {
        cwd: repoPath,
        encoding: 'utf8'
      }).trim();

      if (remoteUrl.includes('github.com')) {
        githubUrl = remoteUrl
          .replace(/^git@github\.com:/, 'https://github.com/')
          .replace(/\.git$/, '');
      }
    } catch (e) {
      // Use default GITHUB_REPO if can't get remote
    }

    return {
      commitId,
      shortCommitId,
      commitUrl: `${githubUrl}/commit/${commitId}`,
      treeUrl: `${githubUrl}/tree/${commitId}`
    };
  } catch (error) {
    console.warn('Warning: Could not get git info:', error.message);
    return null;
  }
}

const readSetRegex =
  /var\s+readSet\s*=\s*\[\]common\.HString\s*\{\s*([^}]+)\s*\}/gm;

const constRegex = /const\s*\(\s*([\s\S]*?)\s*\)/gm;
const constLineRegex = /(\w+)\s*=\s*"([^"]+)"/g;

function extractConstants(content) {
  const constants = {};
  let match;

  while ((match = constRegex.exec(content)) !== null) {
    const constBlock = match[1];
    let constMatch;

    constLineRegex.lastIndex = 0;

    while ((constMatch = constLineRegex.exec(constBlock)) !== null) {
      const constName = constMatch[1];
      const constValue = constMatch[2];

      const commentIndex = constValue.indexOf('//');
      const cleanValue =
        commentIndex !== -1
          ? constValue.substring(0, commentIndex).trim()
          : constValue.trim();

      constants[constName] = cleanValue;
    }
  }

  return constants;
}

function extractReadSet(content, filePath) {
  const results = [];
  let match;

  while ((match = readSetRegex.exec(content)) !== null) {
    const readSetContent = match[1];

    const cleanedContent = readSetContent
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//')) {
          return '';
        }
        return line;
      })
      .join('\n');

    const values = cleanedContent
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => {
        const commentIndex = value.indexOf('//');
        if (commentIndex !== -1) {
          value = value.substring(0, commentIndex).trim();
        }

        if (value.startsWith('document.')) {
          return value.substring('document.'.length);
        }
        return value;
      })
      .filter((value) => value.length > 0);

    let t = path.basename(path.dirname(filePath));

    if (filePath.includes('scoring') || filePath.includes('operation')) {
      const match = content.match(
        /const\s+\(\s*[^)]*?processAndActivityName\s*=\s*"([^"]+)"[^)]*?\)/s
      );
      if (match && match[1]) {
        t = match[1].trim();
      }
    }

    results.push({
      type: t,
      readSet: values
    });
  }

  return results;
}

async function syncReadset({ basePath, outputPublic, system }) {
  const patterns = [
    path.join(basePath, 'internal/process/tasking/**/*.go'),
    path.join(basePath, 'internal/process/document/**/*.go'),
    path.join(basePath, 'internal/process/operation/**/impl.go'),
    path.join(basePath, 'internal/process/scoring/**/impl.go')
  ];

  try {
    let files = [];
    for (const pattern of patterns) {
      const foundFiles = glob.sync(pattern);
      files = files.concat(foundFiles);
    }

    files = [...new Set(files)];

    const allReadSets = [];
    const allConstants = {};
    const fileContents = [];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        fileContents.push({ filePath, content });
        const fileName = path.basename(filePath);

        const readSets = extractReadSet(content, filePath);
        if (readSets.length > 0) {
          allReadSets.push(...readSets);
        }

        if (fileName === 'dp-ndf-v0_10_0.go') {
          const constants = extractConstants(content);
          Object.assign(allConstants, constants);
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    }

    // Fallback: attempt to fill missing constants from any file
    const neededKeys = new Set();
    for (const rs of allReadSets) {
      for (const key of rs.readSet) {
        neededKeys.add(key);
      }
    }

    const missingKeys = [];
    for (const key of neededKeys) {
      if (!Object.prototype.hasOwnProperty.call(allConstants, key)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      for (const { content } of fileContents) {
        const constants = extractConstants(content);
        for (const [key, value] of Object.entries(constants)) {
          if (neededKeys.has(key) && !Object.prototype.hasOwnProperty.call(allConstants, key)) {
            allConstants[key] = value;
          }
        }
      }
    }

    const gitInfo = getGitInfo(basePath);
    if (gitInfo) {
      console.log(`Git commit: ${gitInfo.shortCommitId}`);
      console.log(`GitHub: ${gitInfo.commitUrl}`);
    }

    const outputData = {
      system,
      extractedAt: new Date().toISOString(),
      gitInfo: gitInfo,
      searchPaths: [
        'internal/process/tasking/',
        'internal/process/document/',
        'internal/process/operation/',
        'internal/process/scoring/'
      ],
      totalFiles: files.length,
      totalReadSets: allReadSets.length,
      totalConstants: Object.keys(allConstants).length,
      readSets: allReadSets,
      constants: allConstants
    };

    fs.writeFileSync(outputPublic, JSON.stringify(outputData, null, 2));

    return outputData;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

module.exports = { syncReadset };
