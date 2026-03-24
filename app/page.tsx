"use client";

import { DragEvent, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type Status = "idle" | "uploading" | "done" | "error";

function formatFileName(name: string) {
  const dotIndex = name.lastIndexOf(".");
  const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  return `${baseName}-booklet.pdf`;
}

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("PDF를 놓으면 바로 소책자 PDF로 변환합니다.");
  const [isDragging, setIsDragging] = useState(false);

  const statusLabel = useMemo(() => {
    if (status === "uploading") return "변환 중";
    if (status === "done") return "변환 완료";
    if (status === "error") return "변환 실패";
    return "대기 중";
  }, [status]);

  async function convert(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("error");
      setMessage("PDF 파일만 올릴 수 있습니다.");
      return;
    }

    setStatus("uploading");
    setMessage(`${file.name} 변환 중입니다.`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "변환에 실패했습니다.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = formatFileName(file.name);
      link.click();
      window.URL.revokeObjectURL(url);

      setStatus("done");
      setMessage("양면인쇄용 소책자 PDF를 다운로드했습니다.");
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "알 수 없는 오류로 변환하지 못했습니다.";
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
      <section className={styles.panel}>
        <p className={styles.eyebrow}>PDF Booklet</p>
        <h1 className={styles.title}>PDF를 드롭하면 소책자 PDF로 바꿉니다</h1>
        <p className={styles.description}>
          페이지 수, 소책자 순서, 뒷면 회전까지 자동으로 맞춘 PDF를 바로 내려받습니다.
        </p>

        <label
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            className={styles.input}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              const file = event.target.files?.item(0);
              if (file) {
                void convert(file);
              }
              event.currentTarget.value = "";
            }}
          />
          <span className={styles.dropTitle}>여기에 PDF를 놓으세요</span>
          <span className={styles.dropSubtitle}>또는 클릭해서 파일 선택</span>
        </label>

        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>{statusLabel}</span>
          <p
            className={`${styles.message} ${
              status === "error" ? styles.error : status === "done" ? styles.success : ""
            }`}
          >
            {message}
          </p>
        </div>
      </section>
    </main>
  );
}
