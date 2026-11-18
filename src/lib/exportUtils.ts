export interface ExportTransaction {
  id: string;
  tanggal: string;
  tipe: 'masuk' | 'keluar' | string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
}

export interface ExportSummary {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  totalTransaksi?: number;
  businessName?: string;
  periode?: string;
  docNumber?: string;
  dataType?: 'semua' | 'masuk' | 'keluar';
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

const formatDateIndo = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

function getDocTitle(dataType?: string): string {
  if (dataType === 'masuk') return 'LAPORAN PEMASUKAN BISNIS';
  if (dataType === 'keluar') return 'LAPORAN PENGELUARAN & BIAYA';
  return 'LAPORAN ARUS KAS & BUKU BESAR';
}

function escapeXml(unsafe: string) {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// ============================================================
// 1. EXPORT TO PDF (Dokumen Resmi & Formal Siap Cetak/Simpan PDF)
// ============================================================
export function exportToPDF(transactions: ExportTransaction[], summary: ExportSummary) {
  if (typeof window === 'undefined') return;

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const businessName = summary.businessName || 'Usaha Anda';
  const periode = summary.periode || 'Semua Periode';
  const docTitle = getDocTitle(summary.dataType);
  const docRef = summary.docNumber || `REF/BZK/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

  const tableRowsHtml = transactions.map((trx, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 9px 12px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${idx + 1}</td>
      <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; white-space: nowrap;">${formatDateIndo(trx.tanggal)}</td>
      <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: ${trx.tipe === 'masuk' ? '#2563eb' : '#dc2626'};">${trx.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}</td>
      <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${trx.kategori || '-'}</td>
      <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #1e293b;">${trx.deskripsi || '-'}</td>
      <td style="padding: 9px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; font-family: monospace; color: ${trx.tipe === 'masuk' ? '#2563eb' : '#dc2626'};">
        ${trx.tipe === 'masuk' ? '+' : '-'}${formatRupiah(trx.jumlah)}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${docTitle} - ${businessName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background: #ffffff;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 16px;
          border-bottom: 2.5px solid #2563eb;
          margin-bottom: 18px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 2px 0;
          letter-spacing: -0.3px;
        }
        .brand-sub {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }
        .doc-title {
          text-align: right;
        }
        .doc-title h2 {
          font-size: 15px;
          font-weight: 800;
          color: #2563eb;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .doc-title p {
          font-size: 10px;
          color: #64748b;
          margin: 2px 0;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
        }
        .summary-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }
        .summary-val {
          font-size: 16px;
          font-weight: 800;
          font-family: monospace;
        }
        .val-blue { color: #2563eb; }
        .val-red { color: #dc2626; }
        .val-green { color: #059669; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background-color: #2563eb !important;
          color: #ffffff !important;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 12px;
          text-align: left;
        }
        th.text-right { text-align: right; }
        th.text-center { text-align: center; }
        .footer-total {
          background-color: #f1f5f9;
          font-weight: 800;
          font-size: 12px;
        }
        .sign-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sign-box {
          width: 200px;
          text-align: center;
          font-size: 11px;
        }
        .sign-space {
          height: 60px;
        }
        .sign-name {
          font-weight: 700;
          border-bottom: 1px solid #0f172a;
          padding-bottom: 4px;
        }
        .doc-footer {
          margin-top: 25px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94a3b8;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="brand-title">${businessName}</h1>
          <p class="brand-sub">Laporan Pembukuan Resmi • Bizkit Platform UMKM</p>
          <p class="brand-sub" style="margin-top: 2px;">Periode: <strong>${periode}</strong></p>
        </div>
        <div class="doc-title">
          <h2>${docTitle}</h2>
          <p>No. Dokumen: <strong>${docRef}</strong></p>
          <p>Dicetak: ${printDate}</p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Pemasukan</div>
          <div class="summary-val val-blue">${formatRupiah(summary.totalPemasukan)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Pengeluaran</div>
          <div class="summary-val val-red">${formatRupiah(summary.totalPengeluaran)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Saldo / Arus Kas Bersih</div>
          <div class="summary-val ${summary.saldo >= 0 ? 'val-green' : 'val-red'}">${formatRupiah(summary.saldo)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 35px;">No</th>
            <th style="width: 100px;">Tanggal</th>
            <th style="width: 85px;">Tipe</th>
            <th style="width: 120px;">Kategori</th>
            <th>Keterangan / Deskripsi</th>
            <th class="text-right" style="width: 130px;">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml.length > 0 ? tableRowsHtml : `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">Tidak ada catatan transaksi pada periode ini.</td></tr>`}
        </tbody>
        <tfoot>
          <tr class="footer-total">
            <td colspan="5" style="padding: 10px 12px; text-align: right; border-top: 2px solid #cbd5e1;">TOTAL AKHIR:</td>
            <td style="padding: 10px 12px; text-align: right; border-top: 2px solid #cbd5e1; color: ${summary.saldo >= 0 ? '#059669' : '#dc2626'}; font-weight: 800; font-family: monospace;">
              ${formatRupiah(summary.saldo)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div class="sign-section">
        <div class="sign-box">
          <p style="color: #64748b; margin: 0 0 5px 0;">Disiapkan Oleh,</p>
          <div class="sign-space"></div>
          <div class="sign-name">Staff Administrasi</div>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 9px;">Sistem Bizkit Otomatis</p>
        </div>
        <div class="sign-box">
          <p style="color: #64748b; margin: 0 0 5px 0;">Disetujui Oleh,</p>
          <div class="sign-space"></div>
          <div class="sign-name">${businessName}</div>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 9px;">Pemilik Usaha / Penanggung Jawab</p>
        </div>
      </div>

      <div class="doc-footer">
        <span>Dokumen Resmi Finansial • Dihasilkan otomatis oleh sistem pembukuan Bizkit</span>
        <span>Halaman 1 / Lampiran Cetak Resmi</span>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

// ============================================================
// 2. EXPORT TO EXCEL / SPREADSHEET (Format XML Spreadsheet Resmi)
// ============================================================
export function exportToExcel(transactions: ExportTransaction[], summary: ExportSummary) {
  if (typeof window === 'undefined') return;

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const businessName = summary.businessName || 'Usaha Anda';
  const periode = summary.periode || 'Semua Periode';
  const docTitle = getDocTitle(summary.dataType);

  const rowsXml = transactions.map((trx, idx) => `
    <Row>
      <Cell ss:StyleID="sCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="sText"><Data ss:Type="String">${formatDateIndo(trx.tanggal)}</Data></Cell>
      <Cell ss:StyleID="${trx.tipe === 'masuk' ? 'sIncome' : 'sExpense'}"><Data ss:Type="String">${trx.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}</Data></Cell>
      <Cell ss:StyleID="sText"><Data ss:Type="String">${escapeXml(trx.kategori || '-')}</Data></Cell>
      <Cell ss:StyleID="sText"><Data ss:Type="String">${escapeXml(trx.deskripsi || '-')}</Data></Cell>
      <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${trx.jumlah}</Data></Cell>
    </Row>
  `).join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Borders/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="sTitle">
      <Font ss:FontName="Calibri" ss:Size="15" ss:Bold="1" ss:Color="#1E3A8A"/>
    </Style>
    <Style ss:ID="sSubtitle">
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#64748B"/>
    </Style>
    <Style ss:ID="sSectionHeader">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sHeader">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#2563EB"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sHeaderCenter">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sHeaderRight">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sText">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
      </Borders>
    </Style>
    <Style ss:ID="sCenter">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
      </Borders>
    </Style>
    <Style ss:ID="sCurrency">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
      <Font ss:FontName="Calibri" ss:Bold="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
      </Borders>
    </Style>
    <Style ss:ID="sIncome">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#2563EB"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
      </Borders>
    </Style>
    <Style ss:ID="sExpense">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#DC2626"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
      </Borders>
    </Style>
    <Style ss:ID="sTotalRow">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#CBD5E1"/>
        <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#CBD5E1"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Bold="1" ss:Size="11"/>
      <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
      <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Laporan Keuangan">
    <Table ss:DefaultRowHeight="20">
      <Column ss:Width="35"/>
      <Column ss:Width="110"/>
      <Column ss:Width="100"/>
      <Column ss:Width="140"/>
      <Column ss:Width="240"/>
      <Column ss:Width="130"/>

      <Row ss:Height="26">
        <Cell ss:MergeAcross="5" ss:StyleID="sTitle"><Data ss:Type="String">${escapeXml(businessName.toUpperCase())} - ${escapeXml(docTitle)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="5" ss:StyleID="sSubtitle"><Data ss:Type="String">Periode: ${escapeXml(periode)} | Tanggal Unduh: ${printDate} | Platform Bizkit</Data></Cell>
      </Row>
      <Row/>

      <!-- Ringkasan Eksekutif -->
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="sSectionHeader"><Data ss:Type="String">RINGKASAN FORMAL</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="sSectionHeader"><Data ss:Type="String">NOMINAL</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="sText"><Data ss:Type="String">Total Pemasukan</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="sCurrency"><Data ss:Type="Number">${summary.totalPemasukan}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="sText"><Data ss:Type="String">Total Pengeluaran</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="sCurrency"><Data ss:Type="Number">${summary.totalPengeluaran}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="sText"><Data ss:Type="String">Saldo Kas Bersih</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="sCurrency"><Data ss:Type="Number">${summary.saldo}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="sText"><Data ss:Type="String">Jumlah Baris Transaksi</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="sCenter"><Data ss:Type="Number">${transactions.length}</Data></Cell>
      </Row>
      <Row/>

      <!-- Rincian Transaksi -->
      <Row ss:Height="24">
        <Cell ss:StyleID="sHeaderCenter"><Data ss:Type="String">No</Data></Cell>
        <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tanggal</Data></Cell>
        <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tipe</Data></Cell>
        <Cell ss:StyleID="sHeader"><Data ss:Type="String">Kategori</Data></Cell>
        <Cell ss:StyleID="sHeader"><Data ss:Type="String">Deskripsi</Data></Cell>
        <Cell ss:StyleID="sHeaderRight"><Data ss:Type="String">Nominal (Rp)</Data></Cell>
      </Row>
      ${rowsXml}
      <Row ss:Height="24">
        <Cell ss:MergeAcross="4" ss:StyleID="sTotalRow"><Data ss:Type="String">TOTAL KAS AKHIR:</Data></Cell>
        <Cell ss:StyleID="sTotalRow"><Data ss:Type="Number">${summary.saldo}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const dateTag = new Date().toISOString().split('T')[0];
  const filePrefix = summary.dataType === 'masuk' ? 'Pemasukan' : summary.dataType === 'keluar' ? 'Pengeluaran' : 'Keuangan';
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_${filePrefix}_Bizkit_${dateTag}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// 3. EXPORT TO CSV (Universal, UTF-8 BOM, & Rapi Formal)
// ============================================================
export function exportToCSV(transactions: ExportTransaction[], summary: ExportSummary) {
  if (typeof window === 'undefined') return;

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const businessName = summary.businessName || 'Usaha Anda';
  const periode = summary.periode || 'Semua Periode';
  const docTitle = getDocTitle(summary.dataType);

  const lines: string[] = [
    `"${businessName.toUpperCase()} - ${docTitle}"`,
    `"Periode: ${periode}"`,
    `"Tanggal Cetak: ${printDate}"`,
    '',
    'RINGKASAN LAPORAN FORMAL',
    `"Total Pemasukan",${summary.totalPemasukan}`,
    `"Total Pengeluaran",${summary.totalPengeluaran}`,
    `"Saldo Kas Bersih",${summary.saldo}`,
    `"Jumlah Catatan Transaksi",${transactions.length}`,
    '',
    'RINCIAN CATATAN TRANSAKSI',
    'No,Tanggal,Tipe,Kategori,Deskripsi,Nominal (Rp)'
  ];

  transactions.forEach((trx, index) => {
    const cleanDeskripsi = (trx.deskripsi || '').replace(/"/g, '""');
    const cleanKategori = (trx.kategori || '').replace(/"/g, '""');
    const tipeLabel = trx.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran';
    const tgl = formatDateIndo(trx.tanggal);

    lines.push(`${index + 1},"${tgl}","${tipeLabel}","${cleanKategori}","${cleanDeskripsi}",${trx.jumlah}`);
  });

  lines.push('');
  lines.push(`,,,,"TOTAL SALDO KAS BERSIH",${summary.saldo}`);

  // UTF-8 BOM agar kompatibel dengan Microsoft Excel & Google Sheets tanpa masalah encoding
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateTag = new Date().toISOString().split('T')[0];
  const filePrefix = summary.dataType === 'masuk' ? 'Pemasukan' : summary.dataType === 'keluar' ? 'Pengeluaran' : 'Keuangan';
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_${filePrefix}_Bizkit_${dateTag}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
