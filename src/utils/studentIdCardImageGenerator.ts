import { Student } from '../types/school';
import { getSchoolClassNameBn, toBengaliNumber } from './schoolLogic';

export interface GenerateCardOptions {
  templateUrl?: string;
  format?: 'image/jpeg' | 'image/png';
  quality?: number;
  filename?: string;
}

/**
 * Loads an image from a URL or relative path into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Generates an official high-resolution Digital ID Card Image (650x1028)
 * matching the official "Ananda Pathshala ID Front Final.jpg" template design.
 */
export async function generateStudentIdCardDataUrl(
  student: Student,
  options: GenerateCardOptions = {}
): Promise<string> {
  const {
    templateUrl = '/assets/id_front_clean_template.png',
    format = 'image/jpeg',
    quality = 0.95,
  } = options;

  const width = 650;
  const height = 1028;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 1. Load and draw the official template base
  try {
    const templateImg = await loadImage(templateUrl).catch(() => loadImage('/assets/id_front_ref.jpg'));
    ctx.drawImage(templateImg, 0, 0, width, height);
  } catch (err) {
    console.warn('Could not load template image, drawing vector fallback', err);
    // Vector fallback matching template colors
    // Left green ribbon
    ctx.fillStyle = '#1e4e26';
    ctx.fillRect(0, 0, 141, height);
    // Golden vertical line
    ctx.fillStyle = '#FBB732';
    ctx.fillRect(61, 0, 4, 556);
    // Vertical text "আনন্দ পাঠশালা"
    ctx.save();
    ctx.translate(61, 830);
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 30px "Hind Siliguri", "Nirmala UI", sans-serif';
    ctx.fillStyle = '#FBB732';
    ctx.textAlign = 'center';
    ctx.fillText('আনন্দ পাঠশালা', 0, 10);
    ctx.restore();

    // Top white area
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(141, 0, width - 141, 672);

    // Photo frame border
    ctx.strokeStyle = '#FBB732';
    ctx.lineWidth = 8;
    ctx.strokeRect(224, 230, 332, 406);
  }

  // 2. Clean bottom text region with official pastel green color (#D6EAD1)
  ctx.fillStyle = '#D6EAD1';
  ctx.fillRect(142, 672, width - 142, height - 672);

  // 3. Draw Student Photo into the golden frame (x: 228, y: 234, w: 324, h: 398)
  const photoX = 228;
  const photoY = 234;
  const photoW = 324;
  const photoH = 398;

  let photoDrawn = false;
  if (student.photoUrl) {
    try {
      const studentImg = await loadImage(student.photoUrl);
      const srcW = studentImg.naturalWidth || studentImg.width;
      const srcH = studentImg.naturalHeight || studentImg.height;

      // Object fit cover: crop with vertical bias towards face
      const srcRatio = srcW / srcH;
      const targetRatio = photoW / photoH;

      let sx = 0;
      let sy = 0;
      let sw = srcW;
      let sh = srcH;

      if (srcRatio > targetRatio) {
        sw = srcH * targetRatio;
        sx = (srcW - sw) / 2;
      } else {
        sh = srcW / targetRatio;
        sy = (srcH - sh) * 0.25; // 25% bias from top for face
      }

      ctx.save();
      // Clip with rounded corners matching photo box
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, 12);
      ctx.clip();
      ctx.drawImage(studentImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
      ctx.restore();
      photoDrawn = true;
    } catch {
      photoDrawn = false;
    }
  }

  // Fallback avatar if no photo
  if (!photoDrawn) {
    ctx.save();
    ctx.fillStyle = student.avatarColor || '#047857';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 54px "Hind Siliguri", "Nirmala UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(student.nameBn?.slice(0, 1) || 'আ', photoX + photoW / 2, photoY + photoH / 2 - 25);

    ctx.font = 'bold 22px "Hind Siliguri", "Nirmala UI", sans-serif';
    ctx.fillText(`রোল: ${toBengaliNumber(student.rollNo)}`, photoX + photoW / 2, photoY + photoH / 2 + 35);
    ctx.restore();
  }

  // 4. Draw Student Info Text (Exact font styling and positions)
  ctx.fillStyle = '#0f172a';
  ctx.textBaseline = 'top';

  // Student Name
  ctx.font = 'bold 34px "Hind Siliguri", "Nirmala UI", sans-serif';
  ctx.fillText(student.nameBn || student.nameEn, 186, 680);

  // Black underline under Name
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(186, 726);
  ctx.lineTo(576, 726);
  ctx.stroke();

  // Field values
  const labelFont = 'bold 24px Arial, sans-serif';
  const valFont = 'bold 24px "Hind Siliguri", "Nirmala UI", sans-serif';

  // Format DOB nicely
  let formattedDob = student.birthDate || '১৫/০৫/২০২১';
  if (formattedDob.includes('-')) {
    const parts = formattedDob.split('-');
    if (parts.length === 3) {
      formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const classNameText = `${student.className} (${getSchoolClassNameBn(student.className)})`;
  const mobileText = student.emergencyPhone || '০১৯১৪-০৫৭৫১১';
  const bloodText = student.bloodGroup || 'N/A';
  const idNoText = `AP-2026-${student.rollNo}`;

  // DOB
  ctx.font = labelFont;
  ctx.fillText('DOB:', 186, 742);
  ctx.font = valFont;
  ctx.fillText(formattedDob, 310, 742);

  // Class
  ctx.font = labelFont;
  ctx.fillText('Class:', 186, 780);
  ctx.font = valFont;
  ctx.fillText(classNameText, 310, 780);

  // Mobile
  ctx.font = labelFont;
  ctx.fillText('Mobile:', 186, 818);
  ctx.font = valFont;
  ctx.fillText(mobileText, 310, 818);

  // Blood Group
  ctx.font = labelFont;
  ctx.fillText('Blood Group:', 186, 856);
  ctx.font = valFont;
  ctx.fillText(bloodText, 370, 856);

  // ID NO.
  ctx.font = labelFont;
  ctx.fillText('ID NO.', 186, 922);
  ctx.font = valFont;
  ctx.fillText(idNoText, 280, 922);

  // Signature line at bottom right
  ctx.beginPath();
  ctx.moveTo(430, 948);
  ctx.lineTo(630, 948);
  ctx.stroke();

  // Signature caption
  ctx.fillStyle = '#64748b';
  ctx.font = '13px "Hind Siliguri", "Nirmala UI", sans-serif';
  ctx.fillText('কর্তৃপক্ষের স্বাক্ষর', 480, 958);

  return canvas.toDataURL(format, quality);
}

/**
 * Directly downloads the generated Student ID Card image
 */
export async function downloadStudentIdCardImage(
  student: Student,
  options: GenerateCardOptions = {}
): Promise<void> {
  const dataUrl = await generateStudentIdCardDataUrl(student, options);
  const ext = options.format === 'image/png' ? 'png' : 'jpg';
  const cleanName = (student.nameEn || student.nameBn || 'student')
    .replace(/[^\w\d-]/g, '_')
    .slice(0, 30);
  const filename = options.filename || `Ananda_Pathshala_ID_${cleanName}_Roll_${student.rollNo}.${ext}`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
