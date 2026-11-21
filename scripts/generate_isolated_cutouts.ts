import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const imgPath = 'public/assets/theme2/anandakanon_diorama.jpg';
  const outDir = 'public/assets/theme2/cutouts';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const meta = await sharp(imgPath).metadata();
  const W = meta.width!;
  const H = meta.height!;
  console.log(`Base Image: ${W}x${H}`);

  const elements = [
    {
      name: 'calendar',
      // Hanging calendar board on mango tree (rope, knot, wooden frame, calendar grid)
      points: [
        [138, 120], // top knot of rope
        [206, 175], // top-right of wooden board
        [206, 388], // bottom-right of calendar
        [57, 388],  // bottom-left of calendar
        [57, 175],  // top-left of wooden board
      ],
      feather: 1.5,
    },
    {
      name: 'blackboard',
      // Standing easel with chalkboard, drawings, and tripod legs
      points: [
        [293, 278], // top peg
        [308, 278],
        [308, 318],
        [395, 315], // top-right chalkboard
        [400, 508], // chalk tray right
        [422, 665], // right leg foot
        [398, 665], // right leg inner
        [375, 528], // under chalk tray
        [340, 630], // rear support leg foot
        [322, 630],
        [310, 528], // under chalk tray
        [242, 665], // left leg foot
        [220, 665],
        [208, 528], // left leg top
        [208, 508], // chalk tray left
        [212, 320], // top-left chalkboard
        [293, 318],
      ],
      feather: 2,
    },
    {
      name: 'mastermashai',
      // Pixel-perfect Master Mashai in panjabi, glasses, gentle smile, and sandals
      points: [
        [458, 197], // top of hair
        [444, 203],
        [435, 215],
        [428, 232], // right glasses and temple
        [425, 252], // right cheek
        [430, 272], // right jawline
        [418, 288], // collar right
        [404, 305], // right shoulder
        [395, 318], // right upper arm
        [375, 322], // right hand reaching on blackboard corner
        [370, 335],
        [385, 345],
        [403, 360], // right sleeve
        [408, 410], // right torso
        [408, 470],
        [408, 535], // panjabi right hem
        [416, 540],
        [418, 595], // right white pajama trouser leg
        [415, 608],
        [418, 628], // right sandal foot on grass
        [455, 628],
        [455, 600],
        [458, 545], // between legs
        [466, 595],
        [468, 610],
        [472, 622], // left sandal foot on grass
        [522, 615],
        [520, 595],
        [505, 590], // left white pajama trouser leg
        [512, 535], // panjabi left hem
        [518, 520],
        [525, 475], // left hand fingers
        [530, 440], // left wrist
        [526, 400], // left forearm
        [518, 350], // left upper arm
        [505, 312], // left shoulder
        [492, 290], // left collar
        [488, 275], // left neck
        [494, 260], // left jawline
        [496, 240], // left glasses & ear
        [490, 220], // left hair
        [478, 206],
      ],
      feather: 2,
    },
    {
      name: 'students',
      // Kindergarten children seated on woven colorful mats listening attentively
      points: [
        [530, 620],  // left boy on front mat
        [620, 435],  // boy in middle row
        [720, 440],  // children in back row
        [830, 430],  // boy in cyan shirt
        [1000, 440], // head of boy in far right back
        [1145, 520], // far right child in back
        [1155, 680], // right edge of blue striped mat
        [1060, 725], // front-right girl in pink
        [880, 755],  // front open book
        [745, 755],  // front mats
        [535, 745],  // boy in red shirt
        [490, 680],  // boy in yellow shirt on left mat
      ],
      feather: 2.5,
    },
    {
      name: 'cottage',
      // School cottage with red tin roof, verandah, pillars, and teachers (verandah and house only)
      points: [
        [780, 250],  // left eaves of roof
        [880, 135],  // top roof ridge left
        [1190, 135], // top roof ridge right
        [1285, 245], // right eaves of roof
        [1275, 470], // right wall of cottage
        [1250, 498], // right foundation
        [910, 498],  // right of verandah steps
        [910, 520],  // steps bottom right
        [835, 520],  // steps bottom left
        [835, 498],  // steps top left
        [785, 498],  // left verandah foundation base
        [785, 335],  // left verandah pillar
      ],
      feather: 2,
    },
    {
      name: 'flowers_left',
      // Bright orange and yellow marigolds in front left
      points: [
        [0, 515],
        [150, 520],
        [240, 575],
        [290, 665],
        [320, 768],
        [0, 768],
      ],
      feather: 2.5,
    },
    {
      name: 'flowers_right',
      // Bright pink and yellow roses in front right
      points: [
        [1160, 768],
        [1175, 670],
        [1230, 605],
        [1320, 560],
        [1376, 560],
        [1376, 768],
      ],
      feather: 2.5,
    },
  ];

  const metadataList: any[] = [];

  for (const el of elements) {
    const pts = el.points;
    const minX = Math.max(0, Math.min(...pts.map(p => p[0])));
    const maxX = Math.min(W, Math.max(...pts.map(p => p[0])));
    const minY = Math.max(0, Math.min(...pts.map(p => p[1])));
    const maxY = Math.min(H, Math.max(...pts.map(p => p[1])));

    const cropW = maxX - minX;
    const cropH = maxY - minY;

    const localPoints = pts.map(p => `${p[0] - minX},${p[1] - minY}`).join(' ');

    const svgMask = Buffer.from(
      `<svg width="${cropW}" height="${cropH}" xmlns="http://www.w3.org/2000/svg">
        <filter id="soften">
          <feGaussianBlur stdDeviation="${el.feather}" />
        </filter>
        <polygon points="${localPoints}" fill="#ffffff" filter="url(#soften)" />
      </svg>`
    );

    const croppedBuffer = await sharp(imgPath)
      .extract({ left: minX, top: minY, width: cropW, height: cropH })
      .ensureAlpha()
      .toBuffer();

    const cutoutFileName = `${el.name}.png`;
    const cutoutFilePath = path.join(outDir, cutoutFileName);

    await sharp(croppedBuffer)
      .composite([{
        input: svgMask,
        blend: 'dest-in',
      }])
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(cutoutFilePath);

    console.log(`Generated: ${cutoutFileName} (${cropW}x${cropH}) at [${minX}, ${minY}]`);

    metadataList.push({
      id: el.name,
      left: minX,
      top: minY,
      width: cropW,
      height: cropH,
      leftPercent: ((minX / W) * 100).toFixed(4),
      topPercent: ((minY / H) * 100).toFixed(4),
      widthPercent: ((cropW / W) * 100).toFixed(4),
      heightPercent: ((cropH / H) * 100).toFixed(4),
      cutoutSrc: `/assets/theme2/cutouts/${cutoutFileName}`,
    });
  }

  fs.writeFileSync(
    path.join(outDir, 'cutouts_metadata.json'),
    JSON.stringify(metadataList, null, 2)
  );
  console.log('Saved metadata to cutouts_metadata.json');
}

main().catch(console.error);
