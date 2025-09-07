import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton,
    Snackbar,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHead,
    TablePagination,
    Tooltip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from "@mui/material";
import {
    MdArrowBack,
    MdContentCopy,
    MdOpenInNew,
    MdSend,
    MdEdit,
    MdDelete,
    MdSave,
    MdClose,
} from "react-icons/md";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import type { BaseListMenu } from "../../types";
import classService from "../../services/classService";

// ===== Types =====
type ClassDetail = {
    id: number;
    name: string;
    code: string;
    description?: string;
    grade: number; // 0:10, 1:11, 2:12
    lecturer_id: number;
    lecturer_name: string;
    lecturer_email: string;
    lecturer_mobile: string;
    require_approval?: boolean;
};

type CommentItem = {
    id: number;
    content: string;
    created_at?: string;
    created_by?: number;
    created_by_username?: string;
    user_avatar?: string;
};

type ClassMsg = {
    id: number;
    content: string;
    created_at: string;
    created_by: number;
    created_by_username: string;
    author_avatar?: string;
    comments: CommentItem[];
};

type ClassStudent = {
    id: number;
    full_name?: string;
    username?: string;
    email?: string;
    dob?: string;
    grade?: number;
    gender?: number;
};

const gradeLabels: Record<number, string> = { 0: "Lớp 10", 1: "Lớp 11", 2: "Lớp 12" };

interface Props {
    listMenuUser: BaseListMenu[];
}

const COVER_URL = "https://www.gstatic.com/classroom/themes/img_read.jpg";

const StudentClassDetail: React.FC<Props> = ({ listMenuUser }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const classId = useMemo(() => Number(id), [id]);

    // UI state
    const [tab, setTab] = useState(0); // 0: Tổng quan, 1: Học sinh
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMsg, setSnackMsg] = useState("");
    const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info" | "warning">("info");

    // Data state
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<ClassDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Students
    const [students, setStudents] = useState<ClassStudent[]>([]);
    const [studentsTotal, setStudentsTotal] = useState(0);
    const [studentsPage, setStudentsPage] = useState(0);
    const [studentsRowsPerPage, setStudentsRowsPerPage] = useState(10);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Messages
    const [messages, setMessages] = useState<ClassMsg[]>([]);
    const [sendingMsg, setSendingMsg] = useState(false);
    const [newMsg, setNewMsg] = useState("");

    // Message edit (lecturer)
    const [isLecturer, setIsLecturer] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
    const [editingMsgContent, setEditingMsgContent] = useState("");
    const [savingMsg, setSavingMsg] = useState(false);
    const [deletingMsgId, setDeletingMsgId] = useState<number | null>(null);

    // Comment edits
    const [editingCmt, setEditingCmt] = useState<{ messageId: number; commentId: number } | null>(null);
    const [editingCmtContent, setEditingCmtContent] = useState("");
    const [savingCmt, setSavingCmt] = useState(false);
    const [deletingCmt, setDeletingCmt] = useState<{ messageId: number; commentId: number } | null>(null);
    const [addingCmtForMsgId, setAddingCmtForMsgId] = useState<number | null>(null);

    // Xác nhận xóa
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<
        { type: "message"; messageId: number } |
        { type: "comment"; messageId: number; commentId: number } |
        null
    >(null);

    const askDeleteMessage = (messageId: number) => {
        setConfirmTarget({ type: "message", messageId });
        setConfirmOpen(true);
    };

    const askDeleteComment = (messageId: number, commentId: number) => {
        setConfirmTarget({ type: "comment", messageId, commentId });
        setConfirmOpen(true);
    };

    const closeConfirm = () => {
        setConfirmOpen(false);
        setConfirmTarget(null);
    };

    // Modal mã lớn
    const [openCodeModal, setOpenCodeModal] = useState(false);

    useEffect(() => {
        const role = (localStorage.getItem("role") || "").toLowerCase();
        setIsLecturer(role.includes("lecturer"));
        const uid = localStorage.getItem("userId");
        setCurrentUserId(uid ? Number(uid) : null);
    }, []);

    const showSnack = (
        msg: string,
        severity: React.ComponentProps<typeof Alert>["severity"] = "info"
    ) => {
        setSnackMsg(msg);
        setSnackSeverity(severity);
        setSnackOpen(true);
    };

    // ===== Fetch class detail + messages =====
    const fetchDetail = async () => {
        if (!classId || Number.isNaN(classId)) {
            setError("Mã lớp không hợp lệ");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const [detailRes, msgsRes] = await Promise.all([
                classService.getClassDetail(classId),
                classService.getClassMessages(classId),
            ]);
            const d: ClassDetail = detailRes?.data ?? detailRes;
            const m: ClassMsg[] = msgsRes?.data ?? msgsRes;
            setDetail(d);
            setMessages(Array.isArray(m) ? m : []);
        } catch {
            setError("Không thể tải thông tin lớp hoặc tin nhắn.");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!classId) return;
        try {
            const msgsRes = await classService.getClassMessages(classId);
            const m: ClassMsg[] = msgsRes?.data ?? msgsRes;
            setMessages(Array.isArray(m) ? m : []);
        } catch {
            showSnack("Không thể tải danh sách thông báo", "error");
        }
    };

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId]);

    // ===== Students =====
    const fetchStudents = async (page = studentsPage, size = studentsRowsPerPage) => {
        if (!detail) return;
        try {
            setLoadingStudents(true);
            const res = await classService.getClassStudents({ classId: detail.id, page, size });
            const data = res?.data ?? res;
            const list: ClassStudent[] = Array.isArray(data?.list) ? data.list : [];
            setStudents(list);
            setStudentsTotal(typeof data?.total === "number" ? data.total : list.length);
        } catch {
            setStudents([]);
            setStudentsTotal(0);
            showSnack("Không thể tải danh sách học sinh", "error");
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        if (tab === 1 && detail) {
            fetchStudents(0, studentsRowsPerPage);
            setStudentsPage(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, detail]);

    // ===== Copy / Invite =====
    const copyText = async (text: string, okMsg: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showSnack(okMsg, "success");
        } catch {
            showSnack("Không thể sao chép", "warning");
        }
    };

    const handleCopyCode = async () => {
        if (!detail?.code) return;
        await copyText(detail.code, `Đã sao chép mã lớp: ${detail.code}`);
    };

    const inviteUrl = detail?.code ? `${window.location.origin}/join?code=${detail.code}` : "";

    const handleCopyInvite = async () => {
        if (!inviteUrl) return;
        await copyText(inviteUrl, "Đã sao chép liên kết mời");
    };

    // ===== Message compose (optional) =====
    const handleSendMessage = async () => {
        const content = newMsg.trim();
        if (!content) return;
        try {
            setSendingMsg(true);
            await classService.sendClassMessage(classId, content);
            setNewMsg("");
            await fetchMessages();
            showSnack("Đã đăng thông báo", "success");
        } catch {
            showSnack("Đăng thông báo thất bại", "error");
        } finally {
            setSendingMsg(false);
        }
    };

    // ===== Message edit/delete (only for lecturers) =====
    const beginEditMsg = (msg: ClassMsg) => {
        setEditingMsgId(msg.id);
        setEditingMsgContent(msg.content);
    };
    const cancelEditMsg = () => {
        setEditingMsgId(null);
        setEditingMsgContent("");
    };
    const saveEditMsg = async () => {
        if (!detail || !editingMsgId) return;
        const content = editingMsgContent.trim();
        if (!content) return;
        try {
            setSavingMsg(true);
            await classService.updateClassMessage(detail.id, editingMsgId, content);
            await fetchMessages();
            showSnack("Đã cập nhật thông báo", "success");
            cancelEditMsg();
        } catch {
            showSnack("Cập nhật thông báo thất bại", "error");
        } finally {
            setSavingMsg(false);
        }
    };
    const deleteMsg = async (msgId: number) => {
        if (!detail) return;
        try {
            setDeletingMsgId(msgId);
            await classService.deleteClassMessage(detail.id, msgId);
            await fetchMessages();
            showSnack("Đã xoá thông báo", "success");
        } catch {
            showSnack("Xoá thông báo thất bại", "error");
        } finally {
            setDeletingMsgId(null);
        }
    };

    // ===== Comment add/update/delete =====
    const addComment = async (messageId: number, content: string) => {
        if (!detail) return;
        try {
            setAddingCmtForMsgId(messageId);
            await classService.addMessageComment(detail.id, messageId, content);
            await fetchMessages();
        } catch {
            showSnack("Gửi bình luận thất bại", "error");
        } finally {
            setAddingCmtForMsgId(null);
        }
    };

    const beginEditComment = (messageId: number, comment: CommentItem) => {
        setEditingCmt({ messageId, commentId: comment.id });
        setEditingCmtContent(comment.content);
    };
    const cancelEditComment = () => {
        setEditingCmt(null);
        setEditingCmtContent("");
    };
    const saveEditComment = async () => {
        if (!detail || !editingCmt) return;
        const content = editingCmtContent.trim();
        if (!content) return;
        try {
            setSavingCmt(true);
            await classService.updateMessageComment(detail.id, editingCmt.messageId, editingCmt.commentId, content);
            await fetchMessages();
            cancelEditComment();
            showSnack("Đã cập nhật bình luận", "success");
        } catch {
            showSnack("Cập nhật bình luận thất bại", "error");
        } finally {
            setSavingCmt(false);
        }
    };
    const handleConfirmDelete = async () => {
        if (!detail || !confirmTarget) return;
        try {
            if (confirmTarget.type === "message") {
                setDeletingMsgId(confirmTarget.messageId);
                await classService.deleteClassMessage(detail.id, confirmTarget.messageId);
            } else {
                setDeletingCmt({
                    messageId: confirmTarget.messageId,
                    commentId: confirmTarget.commentId,
                });
                await classService.deleteMessageComment(
                    detail.id,
                    confirmTarget.messageId,
                    confirmTarget.commentId
                );
            }
            await fetchMessages();
            showSnack("Đã xoá thành công", "success");
        } catch {
            showSnack("Xoá thất bại", "error");
        } finally {
            setDeletingMsgId(null);
            setDeletingCmt(null);
            closeConfirm();
        }
    };

    // ===== Helpers =====
    const renderAvatar = (name?: string, src?: string, size = 32) => {
        if (src) {
            return <Avatar src={src} sx={{ width: size, height: size }} />;
        }
        const initials =
            (name || "")
                .split(" ")
                .map((s) => s.charAt(0).toUpperCase())
                .slice(0, 2)
                .join("") || "?";
        return <Avatar sx={{ width: size, height: size }}>{initials}</Avatar>;
    };

    const canEditComment = (c: CommentItem) =>
        isLecturer || (currentUserId != null && c.created_by === currentUserId);

    // ===== Render =====
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar listMenuUser={listMenuUser} />

            <Container className="py-8 flex-grow mt-4 mb-5">
                <Button
                    variant="outlined"
                    startIcon={<MdArrowBack />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 3 }}
                >
                    Quay lại
                </Button>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner animation="border" role="status" />
                        <span className="ms-3 text-gray-600">Đang tải dữ liệu...</span>
                    </div>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : !detail ? (
                    <Alert severity="info">Không tìm thấy lớp.</Alert>
                ) : (
                    <>
                        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                            <Tab label="Tổng quan" />
                            <Tab label="Học sinh" />
                        </Tabs>

                        {/* ===== Tab 0: Tổng quan ===== */}
                        {tab === 0 && (
                            <div className="grid grid-cols-3 gap-6 mb-6">
                                {/* Trái: Tổng quan (ảnh bìa + mô tả + thông báo) */}
                                <div className="col-span-2 mr-4">
                                    {/* Cover */}
                                    <Card elevation={2} sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
                                        <img
                                            src={COVER_URL}
                                            alt="Class cover"
                                            style={{ width: "100%", height: 220, objectFit: "cover" }}
                                        />
                                    </Card>

                                    {/* Mô tả */}
                                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                                {detail.name}
                                            </Typography>

                                            <div className="flex flex-wrap gap-2 mb-3 items-center">
                                                <Chip label={gradeLabels[detail.grade] ?? `Khối ${detail.grade}`} size="small" />
                                                {detail.require_approval && (
                                                    <Chip label="Yêu cầu phê duyệt" size="small" color="warning" />
                                                )}
                                            </div>

                                            {detail.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                                    {detail.description}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Thông báo (messages) */}
                                    <Card elevation={1} sx={{ borderRadius: 3, mt: 3 }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                                Thông báo
                                            </Typography>

                                            {/* Compose message (chỉ GV mới thấy) */}
                                            {/* Compose message (chỉ GV mới thấy) */}
                                            {isLecturer && (
                                                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                                    {renderAvatar(localStorage.getItem("username") || undefined, undefined, 32)}
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Viết thông báo cho lớp..."
                                                        value={newMsg}
                                                        onChange={(e) => setNewMsg(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSendMessage();
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        endIcon={<MdSend />}
                                                        onClick={handleSendMessage}
                                                        disabled={sendingMsg || !newMsg.trim()}
                                                    >
                                                        {sendingMsg ? "Đang gửi..." : "Gửi"}
                                                    </Button>
                                                </Box>
                                            )}

                                            {messages.length === 0 ? (
                                                <Alert severity="info">Chưa có thông báo nào.</Alert>
                                            ) : (
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                    {messages.map((msg) => {
                                                        const isEditing = editingMsgId === msg.id;
                                                        return (
                                                            <Box
                                                                key={msg.id}
                                                                sx={{ p: 2, border: "1px solid #eee", borderRadius: 2 }}
                                                            >
                                                                {/* Header message */}
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "flex-start",
                                                                        justifyContent: "space-between",
                                                                        gap: 2,
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: "flex", gap: 1.5 }}>
                                                                        {renderAvatar(msg.created_by_username, msg.author_avatar, 36)}
                                                                        <Box>
                                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                                {msg.created_by_username || `User #${msg.created_by}`}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {new Date(msg.created_at).toLocaleString("vi-VN")}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Actions for lecturer */}
                                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                        {!isEditing && isLecturer && (
                                                                            <>
                                                                                <Tooltip title="Sửa thông báo">
                                                                                    <span>
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            onClick={() => beginEditMsg(msg)}
                                                                                        >
                                                                                            <MdEdit />
                                                                                        </IconButton>
                                                                                    </span>
                                                                                </Tooltip>
                                                                                <Tooltip title="Xoá thông báo">
                                                                                    <span>
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            onClick={() => askDeleteMessage(msg.id)}
                                                                                            disabled={deletingMsgId === msg.id}
                                                                                        >
                                                                                            <MdDelete />
                                                                                        </IconButton>
                                                                                    </span>
                                                                                </Tooltip>
                                                                            </>
                                                                        )}
                                                                        {isEditing && (
                                                                            <>
                                                                                <Tooltip title="Lưu">
                                                                                    <span>
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            onClick={saveEditMsg}
                                                                                            disabled={savingMsg || !editingMsgContent.trim()}
                                                                                        >
                                                                                            <MdSave />
                                                                                        </IconButton>
                                                                                    </span>
                                                                                </Tooltip>
                                                                                <Tooltip title="Huỷ">
                                                                                    <span>
                                                                                        <IconButton size="small" onClick={cancelEditMsg} disabled={savingMsg}>
                                                                                            <MdClose />
                                                                                        </IconButton>
                                                                                    </span>
                                                                                </Tooltip>
                                                                            </>
                                                                        )}
                                                                    </Box>
                                                                </Box>

                                                                {/* Body message */}
                                                                <Box sx={{ mt: 1 }}>
                                                                    {isEditing ? (
                                                                        <TextField
                                                                            fullWidth
                                                                            size="small"
                                                                            value={editingMsgContent}
                                                                            onChange={(e) => setEditingMsgContent(e.target.value)}
                                                                            multiline
                                                                        />
                                                                    ) : (
                                                                        <Typography variant="body2">{msg.content}</Typography>
                                                                    )}
                                                                </Box>

                                                                {/* Comments */}
                                                                <Divider sx={{ my: 1.5 }} />
                                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                                    {Array.isArray(msg.comments) &&
                                                                        msg.comments.map((cmt) => {
                                                                            const editingThis =
                                                                                editingCmt &&
                                                                                editingCmt.messageId === msg.id &&
                                                                                editingCmt.commentId === cmt.id;

                                                                            return (
                                                                                <Box
                                                                                    key={cmt.id}
                                                                                    sx={{
                                                                                        display: "flex",
                                                                                        alignItems: "flex-start",
                                                                                        gap: 1,
                                                                                    }}
                                                                                >
                                                                                    {renderAvatar(cmt.created_by_username, cmt.user_avatar, 28)}
                                                                                    <Box sx={{ flex: 1 }}>
                                                                                        <Box
                                                                                            sx={{
                                                                                                display: "flex",
                                                                                                alignItems: "center",
                                                                                                justifyContent: "space-between",
                                                                                            }}
                                                                                        >
                                                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                                                {cmt.created_by_username || `User #${cmt.created_by}`}
                                                                                            </Typography>
                                                                                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                                                                                {canEditComment(cmt) && !editingThis && (
                                                                                                    <>
                                                                                                        <Tooltip title="Sửa bình luận">
                                                                                                            <span>
                                                                                                                <IconButton
                                                                                                                    size="small"
                                                                                                                    onClick={() => beginEditComment(msg.id, cmt)}
                                                                                                                >
                                                                                                                    <MdEdit fontSize={18} />
                                                                                                                </IconButton>
                                                                                                            </span>
                                                                                                        </Tooltip>
                                                                                                        <Tooltip title="Xoá bình luận">
                                                                                                            <span>
                                                                                                                <IconButton
                                                                                                                    size="small"
                                                                                                                    onClick={() => askDeleteComment(msg.id, cmt.id)}
                                                                                                                    disabled={
                                                                                                                        !!(
                                                                                                                            deletingCmt &&
                                                                                                                            deletingCmt.messageId === msg.id &&
                                                                                                                            deletingCmt.commentId === cmt.id
                                                                                                                        )
                                                                                                                    }
                                                                                                                >
                                                                                                                    <MdDelete fontSize={18} />
                                                                                                                </IconButton>
                                                                                                            </span>
                                                                                                        </Tooltip>
                                                                                                    </>
                                                                                                )}
                                                                                                {editingThis && (
                                                                                                    <>
                                                                                                        <Tooltip title="Lưu">
                                                                                                            <span>
                                                                                                                <IconButton
                                                                                                                    size="small"
                                                                                                                    onClick={saveEditComment}
                                                                                                                    disabled={savingCmt || !editingCmtContent.trim()}
                                                                                                                >
                                                                                                                    <MdSave fontSize={18} />
                                                                                                                </IconButton>
                                                                                                            </span>
                                                                                                        </Tooltip>
                                                                                                        <Tooltip title="Huỷ">
                                                                                                            <span>
                                                                                                                <IconButton
                                                                                                                    size="small"
                                                                                                                    onClick={cancelEditComment}
                                                                                                                    disabled={savingCmt}
                                                                                                                >
                                                                                                                    <MdClose fontSize={18} />
                                                                                                                </IconButton>
                                                                                                            </span>
                                                                                                        </Tooltip>
                                                                                                    </>
                                                                                                )}
                                                                                            </Box>
                                                                                        </Box>

                                                                                        <Box sx={{ mt: 0.5 }}>
                                                                                            {editingThis ? (
                                                                                                <TextField
                                                                                                    fullWidth
                                                                                                    size="small"
                                                                                                    value={editingCmtContent}
                                                                                                    onChange={(e) => setEditingCmtContent(e.target.value)}
                                                                                                    multiline
                                                                                                />
                                                                                            ) : (
                                                                                                <Typography variant="body2">{cmt.content}</Typography>
                                                                                            )}
                                                                                        </Box>
                                                                                    </Box>
                                                                                </Box>
                                                                            );
                                                                        })}

                                                                    {/* Add comment */}
                                                                    <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                                                        {renderAvatar(localStorage.getItem("username") || undefined, undefined, 28)}
                                                                        <TextField
                                                                            fullWidth
                                                                            size="small"
                                                                            placeholder="Viết bình luận..."
                                                                            onKeyDown={async (e) => {
                                                                                if (e.key === "Enter") {
                                                                                    const value = (e.target as HTMLInputElement).value.trim();
                                                                                    if (value) {
                                                                                        await addComment(msg.id, value);
                                                                                        (e.target as HTMLInputElement).value = "";
                                                                                    }
                                                                                }
                                                                            }}
                                                                            disabled={addingCmtForMsgId === msg.id}
                                                                        />
                                                                        <Button
                                                                            variant="contained"
                                                                            size="small"
                                                                            onClick={async () => {
                                                                                const input = (document.activeElement as HTMLInputElement);
                                                                                // fallback: query previous sibling if needed
                                                                            }}
                                                                            sx={{ display: "none" }}
                                                                        >
                                                                            Gửi
                                                                        </Button>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Phải: Thông tin nhanh (chuyển code + GV qua đây) */}
                                <div className="col-span-1 ml-4" style={{ marginLeft: '16px' }} >
                                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                                                Thông tin nhanh
                                            </Typography>

                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                <Typography variant="body2">
                                                    <b>Mã lớp:</b> {detail.code}
                                                </Typography>
                                                <Tooltip title="Sao chép mã lớp">
                                                    <span>
                                                        <IconButton size="small" onClick={handleCopyCode}>
                                                            <MdContentCopy />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    startIcon={<MdOpenInNew />}
                                                    onClick={() => setOpenCodeModal(true)}
                                                >
                                                    Mở lớn
                                                </Button>
                                            </Box>

                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <b>Khối:</b> {gradeLabels[detail.grade] ?? detail.grade}
                                            </Typography>

                                            <Divider sx={{ my: 1.5 }} />

                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <b>Giáo viên:</b> {detail.lecturer_name.includes('null null') ? 'Chưa có thông tin' : detail.lecturer_name}                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <b>Email:</b> {detail.lecturer_name.includes('null null') ? 'Chưa có thông tin' : detail.lecturer_email}
                                            </Typography>
                                            <Typography variant="body2">
                                                <b>SĐT:</b> {detail.lecturer_name.includes('null null') ? 'Chưa có thông tin' : detail.lecturer_mobile}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* ===== Tab 1: Học sinh ===== */}
                        {tab === 1 && (
                            <Card elevation={2} sx={{ borderRadius: 3 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                        Học sinh trong lớp
                                    </Typography>

                                    {loadingStudents ? (
                                        <div className="flex items-center gap-2 py-8">
                                            <Spinner animation="border" role="status" />
                                            <span className="text-gray-600">Đang tải danh sách...</span>
                                        </div>
                                    ) : students.length === 0 ? (
                                        <Alert severity="info">Chưa có học sinh nào.</Alert>
                                    ) : (
                                        <>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>#</TableCell>
                                                        <TableCell>Họ tên</TableCell>
                                                        <TableCell>Username</TableCell>
                                                        <TableCell>Email</TableCell>
                                                        <TableCell>Ngày sinh</TableCell>
                                                        <TableCell>Khối</TableCell>
                                                        <TableCell>Giới tính</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {students.map((s, idx) => (
                                                        <TableRow key={s.id}>
                                                            <TableCell>{studentsPage * studentsRowsPerPage + idx + 1}</TableCell>
                                                            <TableCell>{s.full_name ?? "-"}</TableCell>
                                                            <TableCell>{s.username ?? "-"}</TableCell>
                                                            <TableCell>{s.email ?? "-"}</TableCell>
                                                            <TableCell>{s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "-"}</TableCell>
                                                            <TableCell>{typeof s.grade === "number" ? (gradeLabels[s.grade] ?? s.grade) : "-"}</TableCell>
                                                            <TableCell>{typeof s.gender === "number" ? s.gender : "-"}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            <TablePagination
                                                component="div"
                                                rowsPerPageOptions={[5, 10, 20]}
                                                count={studentsTotal}
                                                rowsPerPage={studentsRowsPerPage}
                                                page={studentsPage}
                                                onPageChange={async (_e, newPage) => {
                                                    setStudentsPage(newPage);
                                                    await fetchStudents(newPage, studentsRowsPerPage);
                                                }}
                                                onRowsPerPageChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const newSize = parseInt(e.target.value, 10);
                                                    setStudentsRowsPerPage(newSize);
                                                    setStudentsPage(0);
                                                    await fetchStudents(0, newSize);
                                                }}
                                                labelRowsPerPage="Số hàng mỗi trang:"
                                                labelDisplayedRows={({ from, to, count }) =>
                                                    `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`
                                                }
                                            />
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Modal mã lớn + liên kết mời */}
                        <Dialog open={openCodeModal} onClose={() => setOpenCodeModal(false)} maxWidth="sm" fullWidth>
                            <DialogTitle>Mã tham gia lớp</DialogTitle>
                            <DialogContent dividers>
                                <Typography
                                    variant="h3"
                                    sx={{ fontWeight: 900, letterSpacing: 3, textAlign: "center", mb: 2 }}
                                >
                                    {detail.code}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        justifyContent: "center",
                                        mb: 3,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Button variant="outlined" startIcon={<MdContentCopy />} onClick={handleCopyCode}>
                                        Sao chép mã
                                    </Button>
                                </Box>

                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Liên kết mời
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <TextField fullWidth size="small" value={inviteUrl} InputProps={{ readOnly: true }} />
                                    <Button variant="outlined" onClick={handleCopyInvite} startIcon={<MdContentCopy />}>
                                        Sao chép
                                    </Button>
                                    <Button variant="contained" component="a" href={inviteUrl} target="_blank" rel="noreferrer">
                                        Mở
                                    </Button>
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenCodeModal(false)}>Đóng</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
            </Container>
            {/* Confirm delete dialog */}
            <Dialog open={confirmOpen} onClose={closeConfirm} maxWidth="xs" fullWidth>
                <DialogTitle>Xác nhận xóa</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        {confirmTarget?.type === "message"
                            ? "Bạn có chắc chắn muốn xóa thông báo này?"
                            : "Bạn có chắc chắn muốn xóa bình luận này?"}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirm}>Hủy</Button>
                    <Button color="error" variant="contained" onClick={handleConfirmDelete}>
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackOpen}
                onClose={() => setSnackOpen(false)}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: "100%" }}>
                    {snackMsg}
                </Alert>
            </Snackbar>

            <Footer listMenuUser={listMenuUser} />
        </div>
    );
};

export default StudentClassDetail;
