import {
  formatWibDateTime,
  REPORT_TIME_ZONE,
  type RevenueTransaction,
} from "@/lib/revenue-reports";
import type { Worksheet } from "exceljs";

type ExportScope = "visible" | "fnb" | "rental" | "separated";

type RevenueExportOptions = {
  transactions: RevenueTransaction[];
  scope: ExportScope;
  periodLabel: string;
  reportTitle: string;
  filePrefix: string;
};

function sourceLabel(source: RevenueTransaction["source"]) {
  return source === "fnb" ? "FnB" : "Rental";
}

function paymentMethod(method: string | null) {
  return method
    ? method.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Tidak tercatat";
}

function timestamp() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date())
    .replace(/[^0-9]/g, "");
}

function styleSheet(sheet: Worksheet) {
  sheet.views = [{ state: "frozen", ySplit: 6 }];
  sheet.getRow(1).font = { bold: true, size: 16, color: { argb: "FF1B3A2B" } };
  sheet.getRow(5).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(5).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1B3A2B" },
  };
  sheet.getRow(5).alignment = { vertical: "middle" };
}

function addTransactionsSheet(
  workbook: import("exceljs").Workbook,
  sheetName: string,
  transactions: RevenueTransaction[],
  periodLabel: string,
) {
  const sheet = workbook.addWorksheet(sheetName);
  const isRentalMenuReport = transactions.every(
    (transaction) => transaction.menuItemName,
  );
  const totals = transactions.reduce(
    (sum, transaction) => ({
      gross: sum.gross + transaction.grossAmount,
      tax: sum.tax + transaction.taxAmount,
      serviceCharge: sum.serviceCharge + transaction.serviceChargeAmount,
      net: sum.net + transaction.amount,
    }),
    { gross: 0, tax: 0, serviceCharge: 0, net: 0 },
  );

  sheet.addRow([sheetName]);
  sheet.addRow([`Periode: ${periodLabel}`]);
  sheet.addRow([
    `Jumlah transaksi: ${transactions.length}`,
    `Omzet bersih: ${totals.net}`,
  ]);
  sheet.addRow([]);
  sheet.addRow(
    isRentalMenuReport
      ? [
          "Menu rental",
          "Referensi",
          "Tanggal & waktu (WIB)",
          "Metode",
          "Omzet Kotor",
          "Pajak",
          "Service Charge",
          "Omzet Bersih (Net)",
        ]
      : [
          "Referensi",
          "Kategori",
          "Deskripsi",
          "Tanggal & waktu (WIB)",
          "Metode",
          "Omzet Kotor",
          "Pajak",
          "Service Charge",
          "Omzet Bersih (Net)",
        ],
  );

  for (const transaction of transactions) {
    sheet.addRow(
      isRentalMenuReport
        ? [
            transaction.menuItemName || "Menu rental tidak diketahui",
            transaction.reference,
            formatWibDateTime(transaction.occurredAt),
            paymentMethod(transaction.paymentMethod),
            transaction.grossAmount,
            transaction.taxAmount,
            transaction.serviceChargeAmount,
            transaction.amount,
          ]
        : [
            transaction.reference,
            sourceLabel(transaction.source),
            transaction.description,
            formatWibDateTime(transaction.occurredAt),
            paymentMethod(transaction.paymentMethod),
            transaction.grossAmount,
            transaction.taxAmount,
            transaction.serviceChargeAmount,
            transaction.amount,
          ],
    );
  }

  const amountColumns = isRentalMenuReport ? [5, 6, 7, 8] : [6, 7, 8, 9];
  for (const column of amountColumns) {
    sheet.getColumn(column).numFmt = '"Rp" #,##0';
  }
  sheet.getColumn(1).width = isRentalMenuReport ? 28 : 28;
  sheet.getColumn(2).width = 24;
  sheet.getColumn(3).width = isRentalMenuReport ? 24 : 28;
  sheet.getColumn(4).width = isRentalMenuReport ? 20 : 24;
  for (const column of amountColumns) sheet.getColumn(column).width = 20;
  styleSheet(sheet);
}

/** Builds an .xlsx download from the exact rows currently selected in the UI. */
export async function downloadRevenueExcel({
  transactions,
  scope,
  periodLabel,
  reportTitle,
  filePrefix,
}: RevenueExportOptions) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Satu Meja";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Ringkasan");
  const totalsFor = (source?: RevenueTransaction["source"]) =>
    transactions
      .filter((transaction) => !source || transaction.source === source)
      .reduce(
        (sum, transaction) => ({
          gross: sum.gross + transaction.grossAmount,
          tax: sum.tax + transaction.taxAmount,
          serviceCharge: sum.serviceCharge + transaction.serviceChargeAmount,
          net: sum.net + transaction.amount,
        }),
        { gross: 0, tax: 0, serviceCharge: 0, net: 0 },
      );
  const fnbTotal = totalsFor("fnb");
  const rentalTotal = totalsFor("rental");
  const total = totalsFor();
  summary.addRows([
    [reportTitle],
    ["Periode", periodLabel],
    ["Cakupan ekspor", scope === "separated" ? "FnB dan rental, dipisahkan per sheet" : "Sesuai pilihan ekspor"],
    ["Jumlah transaksi", transactions.length],
    [],
    ["Kategori", "Omzet Kotor", "Pajak", "Service Charge", "Omzet Bersih (Net)"],
    ["FnB", fnbTotal.gross, fnbTotal.tax, fnbTotal.serviceCharge, fnbTotal.net],
    ["Rental", rentalTotal.gross, rentalTotal.tax, rentalTotal.serviceCharge, rentalTotal.net],
    ["TOTAL", total.gross, total.tax, total.serviceCharge, total.net],
  ]);
  summary.getColumn(1).width = 28;
  for (let column = 2; column <= 5; column++) {
    summary.getColumn(column).width = 24;
    summary.getColumn(column).numFmt = '"Rp" #,##0';
  }
  summary.getRow(1).font = { bold: true, size: 16, color: { argb: "FF1B3A2B" } };
  summary.getRow(6).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summary.getRow(6).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1B3A2B" },
  };
  summary.getRow(9).font = { bold: true };
  summary.getRow(9).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF7F1E2" },
  };

  if (scope === "separated") {
    addTransactionsSheet(
      workbook,
      "FnB",
      transactions.filter((transaction) => transaction.source === "fnb"),
      periodLabel,
    );
    addTransactionsSheet(
      workbook,
      "Rental",
      transactions.filter((transaction) => transaction.source === "rental"),
      periodLabel,
    );
  } else {
    addTransactionsSheet(workbook, "Transaksi", transactions, periodLabel);
  }

  const bytes = await workbook.xlsx.writeBuffer();
  const blob = new Blob([bytes as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filePrefix}-${timestamp()}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
