import { Injectable } from '@angular/core';

export interface ExcelColumn { key: string; label: string; }

@Injectable({ providedIn: 'root' })
export class ExcelExportService {

  async exportToExcel(data: any[], filename: string, sheetName = 'Données'): Promise<void> {
    if (!data?.length) { alert('Aucune donnée à exporter.'); return; }
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0]).map(k => ({
      wch: Math.max(k.length, ...data.map(r => String(r[k] ?? '').length)) + 2
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_${this.today()}.xlsx`);
  }

  async exportToExcelStyled(
    data: any[], columns: ExcelColumn[], filename: string, title: string, sheetName = 'Rapport'
  ): Promise<void> {
    if (!data?.length) { alert('Aucune donnée à exporter.'); return; }
    const XLSX = await import('xlsx');
    const wsData = [
      [`${title} — Généré le ${new Date().toLocaleDateString('fr-FR')}`],
      [],
      columns.map(c => c.label),
      ...data.map(row => columns.map(c => row[c.key] ?? ''))
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = columns.map(c => ({
      wch: Math.max(c.label.length, ...data.map(r => String(r[c.key] ?? '').length)) + 3
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_${this.today()}.xlsx`);
  }

  async exportCsv(data: any[], filename: string): Promise<void> {
    if (!data?.length) { alert('Aucune donnée à exporter.'); return; }
    const XLSX = await import('xlsx');
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}_${this.today()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
}
