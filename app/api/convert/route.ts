import { NextResponse } from "next/server";
import { degrees, PDFDocument, PDFEmbeddedPage, PDFPage } from "pdf-lib";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

type Pair = [number | null, number | null];

function buildFoldPairs(totalPages: number): Pair[] {
  const pairs: Pair[] = [];

  for (let index = 0; index < totalPages / 2; index += 1) {
    pairs.push([totalPages - index, index + 1]);
  }

  return pairs;
}

function fitIntoSlot(
  embeddedPage: PDFEmbeddedPage,
  slotWidth: number,
  slotHeight: number,
) {
  const scale = Math.min(slotWidth / embeddedPage.width, slotHeight / embeddedPage.height);
  const width = embeddedPage.width * scale;
  const height = embeddedPage.height * scale;

  return {
    width,
    height,
    xOffset: (slotWidth - width) / 2,
    yOffset: (slotHeight - height) / 2,
  };
}

function drawEmbeddedPage(
  targetPage: PDFPage,
  embeddedPage: PDFEmbeddedPage,
  slotX: number,
  slotWidth: number,
  slotHeight: number,
  rotateBackSide: boolean,
) {
  const box = fitIntoSlot(embeddedPage, slotWidth, slotHeight);
  const drawX = slotX + box.xOffset;
  const drawY = box.yOffset;

  if (rotateBackSide) {
    targetPage.drawPage(embeddedPage, {
      x: drawX + box.width,
      y: drawY + box.height,
      width: box.width,
      height: box.height,
      rotate: degrees(180),
    });
    return;
  }

  targetPage.drawPage(embeddedPage, {
    x: drawX,
    y: drawY,
    width: box.width,
    height: box.height,
  });
}

async function convertPdfToBooklet(inputBytes: Uint8Array) {
  const sourcePdf = await PDFDocument.load(inputBytes);
  const sourcePages = sourcePdf.getPages();

  if (sourcePages.length === 0) {
    throw new Error("페이지가 없는 PDF입니다.");
  }

  const totalPages = Math.ceil(sourcePages.length / 4) * 4;
  const outputPdf = await PDFDocument.create();
  const embeddedPages = await outputPdf.embedPages(sourcePages);

  const baseWidth = Math.max(...sourcePages.map((page) => page.getWidth()));
  const baseHeight = Math.max(...sourcePages.map((page) => page.getHeight()));
  const sheetWidth = baseWidth * 2;
  const sheetHeight = baseHeight;
  const pagePairs = buildFoldPairs(totalPages);

  for (const [pairIndex, [leftPageNumber, rightPageNumber]] of pagePairs.entries()) {
    const page = outputPdf.addPage([sheetWidth, sheetHeight]);
    const rotateBackSide = pairIndex % 2 === 1;

    if (leftPageNumber !== null && leftPageNumber <= sourcePages.length) {
      const embeddedLeft = embeddedPages[leftPageNumber - 1];
      drawEmbeddedPage(page, embeddedLeft, 0, baseWidth, baseHeight, rotateBackSide);
    }

    if (rightPageNumber !== null && rightPageNumber <= sourcePages.length) {
      const embeddedRight = embeddedPages[rightPageNumber - 1];
      drawEmbeddedPage(
        page,
        embeddedRight,
        baseWidth,
        baseWidth,
        baseHeight,
        rotateBackSide,
      );
    }
  }

  return outputPdf.save();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF 파일이 없습니다." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 50MB 이하여야 합니다." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "PDF 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const outputBytes = await convertPdfToBooklet(buffer);

    return new NextResponse(outputBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="booklet.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF를 소책자로 변환하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
