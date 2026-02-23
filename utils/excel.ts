
import * as XLSX from 'xlsx';
import { Student } from '../types';

export const parseStudentsFromExcel = (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const students: Student[] = json.map((row, index) => {
          // Menemukan kunci secara case-insensitive dan memangkas spasi dari kunci
          const nameKey = Object.keys(row).find(key => key.trim().toUpperCase() === 'NAMA SISWA');
          const classKey = Object.keys(row).find(key => key.trim().toUpperCase() === 'KELAS');

          if (!nameKey || !row[nameKey] || !classKey || !row[classKey]) {
            throw new Error(`Baris ${index + 2} tidak memiliki kolom 'Nama Siswa' atau 'Kelas' yang valid.`);
          }
          return {
            id: `student-${Date.now()}-${index}`,
            name: String(row[nameKey]),
            class: String(row[classKey]),
          };
        });
        resolve(students);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const parseNameListFromExcel = (file: File, idPrefix: string): Promise<{id: string, name: string}[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);

                const nameList = json.map((row, index) => {
                    const nameKey = Object.keys(row).find(key => key.trim().toUpperCase() === 'NAMA');
                    if (!nameKey || !row[nameKey]) {
                        throw new Error(`Baris ${index + 2} tidak memiliki kolom 'Nama' yang valid.`);
                    }
                    return {
                        id: `${idPrefix}-${Date.now()}-${index}`,
                        name: String(row[nameKey]),
                    };
                });
                resolve(nameList);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};


export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Laporan') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
