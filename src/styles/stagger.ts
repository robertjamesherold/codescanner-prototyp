const stagger = (i: string | number): React.CSSProperties =>
  ({ ['--i' as string]: i } as React.CSSProperties);

export { stagger };