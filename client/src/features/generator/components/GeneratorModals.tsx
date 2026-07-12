import { useEffect, useState } from "react";
import { Modal } from "../../../components/Modal";
import type { HistoryItem } from "../types";
import type { useGenerator } from "../useGenerator";

type GeneratorApi = ReturnType<typeof useGenerator>;

interface GeneratorModalsProps {
  api: GeneratorApi;
}

function HistoryList({
  items,
  onLoad,
  onDelete,
  deleteLabel = "删除"
}: {
  items: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  deleteLabel?: string;
}) {
  if (!items.length) return <p className="modal-empty">{deleteLabel === "删除" ? "暂无生成记录" : "暂无收藏方案"}</p>;
  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="modal-item">
          <div className="modal-item-info">
            <strong>{item.projectName || item.concept}</strong>
            <span>
              {item.concept} × {item.interest} · {item.kit}
            </span>
            <small>{new Date(item.createdAt).toLocaleString("zh-CN")}</small>
          </div>
          <div className="modal-item-actions">
            <button type="button" className="btn primary small" onClick={() => onLoad(item)}>
              查看
            </button>
            <button type="button" className="btn ghost small" onClick={() => onDelete(item.id)}>
              {deleteLabel}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export function GeneratorModals({ api }: GeneratorModalsProps) {
  const {
    historyOpen,
    setHistoryOpen,
    savedOpen,
    setSavedOpen,
    shareOpen,
    setShareOpen,
    shareLink,
    historyList,
    savedList,
    loadInstructionFromHistory,
    deleteHistoryItem,
    removeSavedItem
  } = api;

  const [copyLabel, setCopyLabel] = useState("复制");
  const [wechatLabel, setWechatLabel] = useState("微信");

  useEffect(() => {
    if (!shareOpen) return;
    setCopyLabel("复制");
    setWechatLabel("微信");
  }, [shareOpen]);

  const encodedLink = encodeURIComponent(shareLink);
  const title = encodeURIComponent("MakerMind AI — AI 驱动的 STEAM 项目课生成工作台");
  const desc = encodeURIComponent(
    "输入知识点，AI 在 60 秒内生成完整的 STEAM 项目方案，包含制作步骤、材料清单、代码和训练题。"
  );

  return (
    <>
      <Modal open={historyOpen} title="生成历史记录" onClose={() => setHistoryOpen(false)}>
        <HistoryList items={historyList} onLoad={loadInstructionFromHistory} onDelete={deleteHistoryItem} />
      </Modal>

      <Modal open={savedOpen} title="已收藏方案" onClose={() => setSavedOpen(false)}>
        <HistoryList
          items={savedList}
          onLoad={loadInstructionFromHistory}
          onDelete={removeSavedItem}
          deleteLabel="取消收藏"
        />
      </Modal>

      <Modal open={shareOpen} title="分享方案" onClose={() => setShareOpen(false)} small>
        <p>复制下方链接分享给其他老师：</p>
        <div className="share-link-box">
          <input type="text" readOnly value={shareLink} />
          <button
            type="button"
            className="btn primary small"
            onClick={() => {
              navigator.clipboard.writeText(shareLink).then(() => {
                setCopyLabel("已复制");
                setTimeout(() => setCopyLabel("复制"), 1500);
              });
            }}
          >
            {copyLabel}
          </button>
        </div>
        <div className="share-social-row">
          <p className="share-social-help">或通过社交平台分享：</p>
          <div className="share-social-buttons">
            <a
              className="share-social-btn"
              href={`https://service.weibo.com/share/share.php?url=${encodedLink}&title=${title}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              微博
            </a>
            <a
              className="share-social-btn"
              href={`https://connect.qq.com/widget/shareqq/index.html?url=${encodedLink}&title=${title}&desc=${desc}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              QQ
            </a>
            <a
              className="share-social-btn"
              href={`https://twitter.com/intent/tweet?url=${encodedLink}&text=${title}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            <button
              type="button"
              className="share-social-btn"
              onClick={() => {
                navigator.clipboard.writeText(shareLink).then(() => {
                  setWechatLabel("链接已复制，去微信粘贴");
                  setTimeout(() => setWechatLabel("微信"), 2000);
                });
              }}
            >
              {wechatLabel}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
