/** GitHub Pages 部署时自动添加 base 路径 */
export function asset(path: string): string {
  return (import.meta.env.BASE_URL + path.replace(/^\//, ''))
}

export const BASE = import.meta.env.BASE_URL
