/** Re-mounts on navigation, giving each page a soft "arrival" transition. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
