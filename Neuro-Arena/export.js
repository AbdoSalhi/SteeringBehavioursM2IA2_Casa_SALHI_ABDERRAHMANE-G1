function exportBenchmarkCsv() {
  const rows = circuitHistory.map((entry) => [
    entry.circuitNumber,
    entry.seed,
    entry.difficulty,
    entry.winnerName,
    entry.score
  ]);

  const csv = ["circuit,seed,difficulty,espèce,score"].concat(
    rows.map((row) => row.join(","))
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "neuro-arena-history.csv";
  link.click();
  URL.revokeObjectURL(url);
}
