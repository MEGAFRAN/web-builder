interface TableProps {
  columns: string[];
  rows: string[][];
  striped?: boolean | null;
}

export function Table({ columns, rows, striped }: TableProps) {
  return (
    <div data-component="table" className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            {columns?.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows?.map((row, i) => (
            <tr key={i} className={striped && i % 2 === 0 ? "bg-muted-bg" : "bg-background"}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-sm text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
