"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type Status = "idle" | "uploading" | "done" | "error";
type Locale = "ko" | "en";

type Copy = {
  metaLabel: string;
  localeLabel: string;
  title: string;
  summary: string;
  primaryAction: string;
  secondaryAction: string;
  trustPoints: string[];
  heroNoteTitle: string;
  heroNoteDescription: string;
  heroStatLabel: string;
  heroStatValue: string;
  workflowLabel: string;
  workflowTitle: string;
  workflowSteps: Array<{
    label: string;
    title: string;
    description: string;
  }>;
  panelLabel: string;
  panelTitle: string;
  statusLabels: Record<Status, string>;
  dropTitle: string;
  dropTitleBusy: string;
  dropSubtitle: string;
  dropSubtitleBusy: string;
  fileLabel: string;
  emptyFileTitle: string;
  emptyFileBody: string;
  chooseAnother: string;
  messageLabel: string;
  infoLabel: string;
  infoTitle: string;
  infoItems: string[];
  metricLabel: string;
  metricTitle: string;
  metricItems: Array<{ value: string; label: string }>;
  idleMessage: string;
  invalidType: string;
  doneMessage: string;
  uploadingMessage: (fileName: string) => string;
  genericError: string;
  sheetsTitle: string;
  frontLabel: string;
  backLabel: string;
  rotateLabel: string;
};

const COPY: Record<Locale, Copy> = {
  ko: {
    metaLabel: "Booklet App",
    localeLabel: "언어",
    title: "접어서 바로 제본할 수 있는 PDF로 다시 정리합니다",
    summary:
      "원본 PDF를 올리면 소책자 인쇄 순서, 면 배치, 뒷면 회전까지 자동으로 맞춘 결과물을 바로 내려받습니다.",
    primaryAction: "PDF 선택",
    secondaryAction: "사용 흐름 보기",
    trustPoints: [
      "PDF만 업로드할 수 있습니다",
      "최대 파일 크기는 50MB입니다",
      "페이지 수가 4의 배수가 아니어도 자동 보정합니다",
    ],
    heroNoteTitle: "자동 정렬",
    heroNoteDescription: "앞면과 뒷면이 접지 순서에 맞게 배치됩니다.",
    heroStatLabel: "출력 방식",
    heroStatValue: "양면 인쇄 · Long-edge flip",
    workflowLabel: "Workflow",
    workflowTitle: "한 번 올리면 끝나는 3단 변환 흐름",
    workflowSteps: [
      {
        label: "1. 업로드",
        title: "PDF 한 개를 올립니다",
        description: "원본 페이지 순서를 읽고 소책자용 시트를 계산합니다.",
      },
      {
        label: "2. 재배열",
        title: "접지 순서에 맞게 재구성합니다",
        description: "4의 배수 보정과 앞뒤 면 순서를 자동으로 맞춥니다.",
      },
      {
        label: "3. 다운로드",
        title: "바로 인쇄 가능한 파일을 받습니다",
        description: "긴 변 뒤집기 기준의 소책자 인쇄 PDF를 즉시 내려받습니다.",
      },
    ],
    panelLabel: "Converter",
    panelTitle: "PDF를 올리고 바로 내려받기",
    statusLabels: {
      idle: "준비 완료",
      uploading: "변환 중",
      done: "다운로드 완료",
      error: "문제 발생",
    },
    dropTitle: "여기에 PDF를 놓으세요",
    dropTitleBusy: "변환 작업을 진행 중입니다",
    dropSubtitle: "드래그 앤 드롭 또는 클릭으로 파일을 선택할 수 있습니다",
    dropSubtitleBusy: "완료되면 자동으로 다운로드됩니다",
    fileLabel: "현재 파일",
    emptyFileTitle: "아직 선택된 PDF가 없습니다",
    emptyFileBody: "업로드 후 변환 결과 파일명이 여기 표시됩니다",
    chooseAnother: "다른 파일 선택",
    messageLabel: "상태 메시지",
    infoLabel: "Output Guide",
    infoTitle: "출력 전에 확인할 것",
    infoItems: [
      "양면 인쇄에서는 긴 변 기준 뒤집기를 권장합니다.",
      "페이지 수가 부족하면 빈 면이 자동으로 포함될 수 있습니다.",
      "출력 후 반으로 접고 중앙 스테이플 제본에 맞춰 사용할 수 있습니다.",
    ],
    metricLabel: "Why It Feels Safe",
    metricTitle: "앱이 직접 알려주는 핵심 제약",
    metricItems: [
      { value: "50MB", label: "업로드 허용 크기" },
      { value: "PDF Only", label: "지원 파일 형식" },
      { value: "Auto 4-up", label: "소책자 면수 자동 보정" },
    ],
    idleMessage: "파일을 올리면 바로 인쇄용 소책자 PDF를 만듭니다.",
    invalidType: "PDF 파일만 올릴 수 있습니다.",
    doneMessage: "양면 인쇄용 소책자 PDF를 다운로드했습니다.",
    uploadingMessage: (fileName) => `${fileName}를 소책자 순서로 재배열하는 중입니다.`,
    genericError: "알 수 없는 오류로 변환하지 못했습니다.",
    sheetsTitle: "자동 배치",
    frontLabel: "앞면",
    backLabel: "뒷면",
    rotateLabel: "180도 회전",
  },
  en: {
    metaLabel: "Booklet App",
    localeLabel: "Language",
    title: "Turn any PDF into a fold-ready booklet layout",
    summary:
      "Upload the original PDF and download a print-ready booklet file with page order, spread layout, and back-side rotation handled for you.",
    primaryAction: "Choose PDF",
    secondaryAction: "See workflow",
    trustPoints: [
      "Only PDF files are accepted",
      "Maximum file size is 50MB",
      "Page counts are padded automatically to booklet sheets",
    ],
    heroNoteTitle: "Auto imposition",
    heroNoteDescription: "Front and back spreads are arranged in fold order automatically.",
    heroStatLabel: "Print mode",
    heroStatValue: "Duplex · Long-edge flip",
    workflowLabel: "Workflow",
    workflowTitle: "A three-step flow built for quick printing",
    workflowSteps: [
      {
        label: "1. Upload",
        title: "Drop in one PDF",
        description: "The app reads the original sequence and calculates booklet sheets.",
      },
      {
        label: "2. Reorder",
        title: "Rebuild the file for folding",
        description: "Page padding and front-back spread order are corrected automatically.",
      },
      {
        label: "3. Download",
        title: "Get a print-ready booklet PDF",
        description: "The result is exported for duplex printing with long-edge flipping.",
      },
    ],
    panelLabel: "Converter",
    panelTitle: "Upload once and download the booklet file",
    statusLabels: {
      idle: "Ready",
      uploading: "Converting",
      done: "Downloaded",
      error: "Error",
    },
    dropTitle: "Drop your PDF here",
    dropTitleBusy: "The booklet file is being generated",
    dropSubtitle: "Drag and drop or click to choose a file",
    dropSubtitleBusy: "The download will start automatically when it finishes",
    fileLabel: "Current file",
    emptyFileTitle: "No PDF selected yet",
    emptyFileBody: "The converted booklet filename will appear here after upload",
    chooseAnother: "Choose another file",
    messageLabel: "Status message",
    infoLabel: "Output Guide",
    infoTitle: "Check these print details before exporting",
    infoItems: [
      "For duplex printing, long-edge flip is the recommended setting.",
      "Blank pages may be inserted automatically when the page count is short.",
      "The result is arranged for fold-and-staple center booklet printing.",
    ],
    metricLabel: "Why It Feels Safe",
    metricTitle: "Constraints the app makes explicit",
    metricItems: [
      { value: "50MB", label: "Maximum upload size" },
      { value: "PDF Only", label: "Accepted format" },
      { value: "Auto 4-up", label: "Booklet sheet padding" },
    ],
    idleMessage: "Upload a file to generate a print-ready booklet PDF immediately.",
    invalidType: "Only PDF files can be uploaded.",
    doneMessage: "Your duplex-ready booklet PDF has been downloaded.",
    uploadingMessage: (fileName) => `Reordering ${fileName} into booklet spreads.`,
    genericError: "The PDF could not be converted due to an unexpected error.",
    sheetsTitle: "Auto layout",
    frontLabel: "Front",
    backLabel: "Back",
    rotateLabel: "Rotate 180",
  },
};

function detectLocale(): Locale {
  if (typeof window === "undefined") {
    return "ko";
  }

  const storedLocale = window.localStorage.getItem("booklet-locale");
  if (storedLocale === "ko" || storedLocale === "en") {
    return storedLocale;
  }

  return window.navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}

function formatFileName(name: string) {
  const dotIndex = name.lastIndexOf(".");
  const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  return `${baseName}-booklet.pdf`;
}

function formatBytes(size: number, locale: Locale) {
  if (size < 1024 * 1024) {
    const unit = locale === "ko" ? "KB" : "KB";
    return `${Math.max(1, Math.round(size / 1024))} ${unit}`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [locale, setLocale] = useState<Locale>("ko");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(COPY.ko.idleMessage);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const copy = COPY[locale];

  useEffect(() => {
    const nextLocale = detectLocale();
    setLocale(nextLocale);
    setMessage(COPY[nextLocale].idleMessage);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("booklet-locale", locale);
    }
  }, [locale]);

  const statusMeta = useMemo(() => {
    if (status === "uploading") {
      return { label: copy.statusLabels.uploading, tone: styles.statusUploading };
    }

    if (status === "done") {
      return { label: copy.statusLabels.done, tone: styles.statusDone };
    }

    if (status === "error") {
      return { label: copy.statusLabels.error, tone: styles.statusError };
    }

    return { label: copy.statusLabels.idle, tone: styles.statusIdle };
  }, [copy.statusLabels, status]);

  async function convert(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setSelectedFile(file);
      setStatus("error");
      setMessage(copy.invalidType);
      return;
    }

    setSelectedFile(file);
    setStatus("uploading");
    setMessage(copy.uploadingMessage(file.name));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("lang", locale);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? copy.genericError);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = formatFileName(file.name);
      link.click();
      window.URL.revokeObjectURL(url);

      setStatus("done");
      setMessage(copy.doneMessage);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : copy.genericError;
      setStatus("error");
      setMessage(nextMessage);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files.item(0);
    if (file) {
      void convert(file);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroIntro}>
          <div className={styles.heroTop}>
            <div>
              <p className={styles.kicker}>{copy.metaLabel}</p>
              <p className={styles.heroStat}>
                <span>{copy.heroStatLabel}</span>
                <strong>{copy.heroStatValue}</strong>
              </p>
            </div>

            <div className={styles.localeSwitch} aria-label={copy.localeLabel}>
              <button
                className={`${styles.localeButton} ${locale === "ko" ? styles.localeButtonActive : ""}`}
                type="button"
                onClick={() => {
                  setLocale("ko");
                  if (status === "idle") {
                    setMessage(COPY.ko.idleMessage);
                  }
                }}
              >
                KO
              </button>
              <button
                className={`${styles.localeButton} ${locale === "en" ? styles.localeButtonActive : ""}`}
                type="button"
                onClick={() => {
                  setLocale("en");
                  if (status === "idle") {
                    setMessage(COPY.en.idleMessage);
                  }
                }}
              >
                EN
              </button>
            </div>
          </div>

          <div className={styles.heroCopy}>
            <h1 className={styles.title}>{copy.title}</h1>
            <p className={styles.summary}>{copy.summary}</p>
          </div>

          <div className={styles.heroActions}>
            <button
              className={styles.primaryAction}
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              {copy.primaryAction}
            </button>
            <a className={styles.secondaryAction} href="#workspace">
              {copy.secondaryAction}
            </a>
          </div>

          <ul className={styles.guideList}>
            {copy.trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className={styles.heroPreview} aria-hidden="true">
          <div className={styles.previewHeader}>
            <p>{copy.sheetsTitle}</p>
            <span>Sheet 01</span>
          </div>

          <div className={styles.sheet}>
            <div className={styles.sheetHeader}>
              <span>{copy.frontLabel}</span>
              <span>16 / 1</span>
            </div>
            <div className={styles.sheetPages}>
              <div className={styles.sheetPage}>
                <span>16</span>
              </div>
              <div className={styles.sheetPage}>
                <span>1</span>
              </div>
            </div>
          </div>

          <div className={`${styles.sheet} ${styles.sheetBack}`}>
            <div className={styles.sheetHeader}>
              <span>{copy.backLabel}</span>
              <span>{copy.rotateLabel}</span>
            </div>
            <div className={styles.sheetPages}>
              <div className={styles.sheetPage}>
                <span>2</span>
              </div>
              <div className={styles.sheetPage}>
                <span>15</span>
              </div>
            </div>
          </div>

          <div className={styles.previewNote}>
            <strong>{copy.heroNoteTitle}</strong>
            <p>{copy.heroNoteDescription}</p>
          </div>
        </div>
      </section>

      <section className={styles.workflow} id="workspace">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionLabel}>{copy.workflowLabel}</p>
          <h2>{copy.workflowTitle}</h2>
        </div>

        <div className={styles.workflowGrid}>
          {copy.workflowSteps.map((step) => (
            <article className={styles.workflowItem} key={step.label}>
              <p className={styles.workflowLabel}>{step.label}</p>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.converterPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>{copy.panelLabel}</p>
              <h2>{copy.panelTitle}</h2>
            </div>
            <span className={`${styles.statusBadge} ${statusMeta.tone}`}>{statusMeta.label}</span>
          </div>

          <label
            className={`${styles.dropzone} ${isDragging ? styles.dragging : ""} ${
              status === "uploading" ? styles.dropzoneBusy : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              if (status !== "uploading") {
                setIsDragging(true);
              }
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              if (status === "uploading") {
                event.preventDefault();
                return;
              }
              handleDrop(event);
            }}
          >
            <input
              ref={inputRef}
              className={styles.input}
              type="file"
              accept="application/pdf,.pdf"
              disabled={status === "uploading"}
              onChange={(event) => {
                const file = event.target.files?.item(0);
                if (file) {
                  void convert(file);
                }
                event.currentTarget.value = "";
              }}
            />

            <div className={styles.dropzoneBody}>
              <span className={styles.dropTitle}>
                {status === "uploading" ? copy.dropTitleBusy : copy.dropTitle}
              </span>
              <span className={styles.dropSubtitle}>
                {status === "uploading" ? copy.dropSubtitleBusy : copy.dropSubtitle}
              </span>
            </div>
          </label>

          <div className={styles.fileCard}>
            <div className={styles.fileMeta}>
              <p className={styles.fileLabel}>{copy.fileLabel}</p>
              <strong>{selectedFile ? selectedFile.name : copy.emptyFileTitle}</strong>
              <span>
                {selectedFile
                  ? `${formatBytes(selectedFile.size, locale)} · ${formatFileName(selectedFile.name)}`
                  : copy.emptyFileBody}
              </span>
            </div>

            <button
              className={styles.ghostAction}
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={status === "uploading"}
            >
              {copy.chooseAnother}
            </button>
          </div>

          <div className={styles.messageBlock}>
            <p className={styles.messageLabel}>{copy.messageLabel}</p>
            <p className={styles.message}>{message}</p>
          </div>
        </div>

        <aside className={styles.infoPanel}>
          <div className={styles.infoBlock}>
            <p className={styles.sectionLabel}>{copy.infoLabel}</p>
            <h2>{copy.infoTitle}</h2>
            <ul className={styles.infoList}>
              {copy.infoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.infoBlock}>
            <p className={styles.sectionLabel}>{copy.metricLabel}</p>
            <h2>{copy.metricTitle}</h2>
            <div className={styles.metricList}>
              {copy.metricItems.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
