import fs from 'fs';
import path from 'path';

function formatBDPhone(raw: string): string {
  if (!raw) return '01700-000000';
  let cleaned = raw.replace(/[^\d]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '0' + cleaned;
  }
  if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  }
  if (cleaned.length === 11) {
    return cleaned.slice(0, 5) + '-' + cleaned.slice(5);
  }
  return raw.trim();
}

function mapClass(raw: string): string {
  const c = (raw || '').trim().toLowerCase();
  if (c.includes('hate') || c.includes('khori')) return 'HateKhori';
  if (c.includes('play')) return 'Play';
  if (c.includes('nurser')) return 'Nursery';
  if (c.includes('kg')) return 'KG';
  if (c.includes('two') || c === '2' || c.includes('class-2')) return 'Class-2';
  if (c.includes('one') || c === '1' || c.includes('class-1')) return 'Class-1';
  return 'Play';
}

const csvPath = path.resolve('src/data/student_excel_data.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.trim().split('\n').slice(1);

interface CsvStudentInfo {
  num: string;
  studentId: string; // 26-201
  targetId: string; // std-zk-201
  studentNameEn: string;
  fatherName: string;
  motherName: string;
  birthDate: string;
  blood: string;
  className: string;
  phone: string;
}

const csvMap = new Map<string, CsvStudentInfo>();
for (const line of lines) {
  const parts = line.split(',');
  const idRaw = parts[0].trim();
  const num = idRaw.replace('26-', '');
  const targetId = 'std-zk-' + num;
  csvMap.set(targetId, {
    num,
    studentId: idRaw,
    targetId,
    studentNameEn: parts[1].trim(),
    fatherName: parts[2].trim(),
    motherName: parts[3].trim(),
    birthDate: parts[4].trim(),
    blood: parts[5].trim() === '-' ? 'N/A' : parts[5].trim(),
    className: mapClass(parts[6]),
    phone: formatBDPhone(parts[7]),
  });
}

console.log(`Loaded ${csvMap.size} students from CSV.`);

// Load existing zlinkRosterData.ts
const zlinkPath = path.resolve('src/data/zlinkRosterData.ts');
const zlinkContent = fs.readFileSync(zlinkPath, 'utf-8');

// Find the line where ZLINK_SYNCED_STUDENTS starts
const marker = 'export const ZLINK_SYNCED_STUDENTS: Student[] = ';
const markerIdx = zlinkContent.indexOf(marker);
if (markerIdx === -1) {
  throw new Error('Could not find ZLINK_SYNCED_STUDENTS marker in zlinkRosterData.ts');
}

const teachersCode = zlinkContent.slice(0, markerIdx);

// Import current ZLINK_SYNCED_STUDENTS
const { ZLINK_SYNCED_STUDENTS } = await import('../src/data/zlinkRosterData.ts');

let updatedCount = 0;
const updatedStudents = ZLINK_SYNCED_STUDENTS.map((std: any) => {
  const info = csvMap.get(std.id);
  if (!info) {
    console.warn(`No CSV match for student ${std.id}`);
    return std;
  }

  updatedCount++;
  const primaryPhone = info.phone;

  return {
    ...std,
    nameEn: info.studentNameEn,
    className: info.className,
    birthDate: info.birthDate,
    bloodGroup: info.blood,
    emergencyPhone: primaryPhone,
    fatherNameBn: info.fatherName,
    motherNameBn: info.motherName,
    homeAddressBn: 'কোর্টপাড়া, কুষ্টিয়া',
    authorizedPickups: [
      {
        id: `p-${info.num}-1`,
        nameBn: info.fatherName,
        relationBn: 'পিতা',
        relationshipBn: 'পিতা',
        phone: primaryPhone,
        isPrimary: true,
      },
      {
        id: `p-${info.num}-2`,
        nameBn: info.motherName,
        relationBn: 'মাতা',
        relationshipBn: 'মাতা',
        phone: primaryPhone,
        isPrimary: false,
      },
    ],
  };
});

console.log(`Updated ${updatedCount} students.`);

// Generate pretty TypeScript code for ZLINK_SYNCED_STUDENTS
const newZlinkContent = `${teachersCode}${marker}${JSON.stringify(updatedStudents, null, 2)};\n`;
fs.writeFileSync(zlinkPath, newZlinkContent, 'utf-8');
console.log('Successfully written updated data to src/data/zlinkRosterData.ts');

// Also update public/zlink_all_persons.json
const jsonPath = path.resolve('public/zlink_all_persons.json');
if (fs.existsSync(jsonPath)) {
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  if (Array.isArray(jsonContent.students)) {
    jsonContent.students = jsonContent.students.map((s: any) => {
      const targetId = 'std-zk-' + s.personId;
      const info = csvMap.get(targetId);
      if (info) {
        return {
          ...s,
          name: info.studentNameEn,
          mobile: info.phone,
          className: info.className,
          fatherName: info.fatherName,
          motherName: info.motherName,
          birthDate: info.birthDate,
          bloodGroup: info.blood,
        };
      }
      return s;
    });
    fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2), 'utf-8');
    console.log('Successfully updated public/zlink_all_persons.json');
  }
}
