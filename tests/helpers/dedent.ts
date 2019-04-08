import stripIndent from 'strip-indent';

export default function dedent(parts) {
  return stripIndent(parts[0].substring(1)).trim() + '\n';
}
