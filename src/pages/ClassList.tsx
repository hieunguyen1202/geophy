import React, { useState, useEffect } from "react";
import { Container, Button, Modal, Form } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import ContentManagerSidebar from "../components/layout/ContentManagerSidebar";
import ContentManagerNavbar from "../components/layout/ContentManagerNavbar";
import ContentManagerFooter from "../components/layout/ContentManagerFooter";
import LecturerSidebar from "../components/layout/LecturerSidebar";
import LecturerNavbar from "../components/layout/LecturerNavbar";
import LecturerFooter from "../components/layout/LecturerFooter";
import classService from "../services/classService";
import type { Class } from "../types/class";
import { useLocation, Link as ReactRouterLink, useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Paper from "@mui/material/Paper";
import { Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EyeIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import PeopleIcon from "@mui/icons-material/People";
import ViewStudentsModal from "../components/ViewStudentsModal";
import Badge from "@mui/material/Badge";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import Tooltip from "@mui/material/Tooltip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LinkIcon from "@mui/icons-material/Link"; 

const gradeMapping: { [key: number]: string } = { 0: "Lớp 10", 1: "Lớp 11", 2: "Lớp 12" };

const ClassList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState<string>(localStorage.getItem("role") || "");
  const [lecturerName, setLecturerName] = useState<string>(localStorage.getItem("lecturerName") || "");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lecturerId, setLecturerId] = useState<number | null>(null);

  const [classes, setClasses] = useState<Class[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; grade: number; require_approval: boolean }>({
    name: "",
    description: "",
    grade: 0,
    require_approval: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [gradeFilter, setGradeFilter] = useState<number | "">("");

  const [snackbarMessages, setSnackbarMessages] = useState<string[]>([]);
  const [snackbarQueue, setSnackbarQueue] = useState<string[]>([]);
  const [snackbarIndex, setSnackbarIndex] = useState(0);
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [formSubmitted] = useState(false);

  // ===== Requests modal state =====
  type RequestStudent = {
    id: number;
    username?: string;
    email?: string;
    dob?: string;
    grade?: number;
    gender?: number;
    full_name?: string;
  };
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedClassForRequests, setSelectedClassForRequests] = useState<{ id: number; name: string } | null>(null);
  const [requests, setRequests] = useState<RequestStudent[]>([]);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [requestsPage, setRequestsPage] = useState(0);
  const [requestsRowsPerPage, setRequestsRowsPerPage] = useState(10);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestCounts, setRequestCounts] = useState<Record<number, number>>({});
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [deciding, setDeciding] = useState(false);

  const canEdit = role === "lecturer" || role === "LECTURER";
  type ClassDetail = {
    id: number;
    name: string;
    code: string;
    description: string;
    grade: number;
    lecturer_id: number;
    lecturer_name: string;
    lecturer_email: string;
    lecturer_mobile: string;
  };

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const openDetailModal = async (id: number) => {
    try {
      setLoadingDetail(true);
      const res = await classService.getClassDetail(id);
      const data: ClassDetail = res?.data ?? res; // API: { message:[], data:{...} }
      setClassDetail(data);
      setShowDetailModal(true);
    } catch (e: any) {
      const msg = extractMessage(e?.response?.data ?? e?.message, "Không thể lấy thông tin lớp học!");
      setSnackbarMessages([msg]);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ===== Helpers =====
  const extractMessage = (responseData: any, defaultMsg: string): string => {
    if (!responseData) return defaultMsg;
    const msgs = responseData.messages || responseData.message;
    if (Array.isArray(msgs)) return msgs.join(", ");
    if (typeof msgs === "string") return msgs;
    return defaultMsg;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setForm((prev) => ({ ...prev, [name]: target.checked }));
    } else if (name === "grade") {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const refreshRequestCount = async (classId: number) => {
    try {
      const res = await classService.getStudentsRequests({ classId, page: 0, size: 1 });
      const data = res?.data ?? res;
      setRequestCounts((prev) => ({ ...prev, [classId]: data?.total ?? 0 }));
    } catch (err) {
      // noop: không cần xử lý lỗi phần đếm
    }
  };

  // ===== Effects =====
  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    const storedLecturerName = localStorage.getItem("lecturerName") || "";
    const uid = localStorage.getItem("userId");
    setRole(storedRole);
    setLecturerName(storedLecturerName);
    setLecturerId(uid ? Number(uid) : null);

    if ((storedRole.includes("lecturer") || storedRole.includes("LECTURER")) && !location.pathname.startsWith("/lecturer")) {
      navigate("/lecturer/classes", { replace: true });
    } else if (storedRole.includes("content manager") && !location.pathname.startsWith("/content-manager")) {
      navigate("/content-manager/classes", { replace: true });
    }
  }, [location.pathname, navigate]);
  // Initialize tooltips
  useEffect(() => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      console.log(tooltipTriggerEl);
    });
  }, []);
  const fetchClasses = async () => {
    try {
      const params: any = {
        page,
        size: rowsPerPage === 10000 ? 10000 : rowsPerPage,
      };
      if (searchTerm.trim()) params.search = searchTerm;
      if (gradeFilter !== "") params.grade = gradeFilter;
      if (role.includes("lecturer")) {
        if (lecturerId != null && !Number.isNaN(lecturerId)) params.lecturer_id = lecturerId;
      } else if (role.includes("content manager")) {
        params.lecturerName = "";
      }
      const { list = [], total = 0 } = await classService.getClasses(params);
      setClasses(list);
      setTotal(total);
    } catch (e) {
      setSnackbarMessages(["Không thể tải danh sách lớp học!"]);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [page, rowsPerPage, searchTerm, gradeFilter, role, lecturerName, lecturerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load badge counts for visible classes
  useEffect(() => {
    let cancelled = false;
    const loadCounts = async () => {
      if (classes.length === 0) {
        setRequestCounts({});
        return;
      }
      try {
        const results = await Promise.all(
          classes.map(async (c) => {
            try {
              const res = await classService.getStudentsRequests({ classId: c.id, page: 0, size: 1 });
              const data = res?.data ?? res;
              return { id: c.id, total: data?.total ?? 0 };
            } catch {
              return { id: c.id, total: 0 };
            }
          })
        );
        if (!cancelled) {
          const map: Record<number, number> = {};
          results.forEach((r) => (map[r.id] = r.total));
          setRequestCounts(map);
        }
      } catch {
        // noop
      }
    };
    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [classes]);

  // ===== CRUD & actions =====
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setRowsPerPage(value === -1 ? 10000 : value);
    setPage(0);
  };

  const handleShowModal = (cls?: Class) => {
    if (cls) {
      setEditClass(cls);
      setForm({
        name: cls.name,
        description: cls.description,
        grade: cls.grade,
        require_approval: cls.require_approval,
      });
    } else {
      setEditClass(null);
      setForm({ name: "", description: "", grade: 0, require_approval: false });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditClass(null);
    setForm({ name: "", description: "", grade: 0, require_approval: false });
  };

  const handleSave = async () => {
    if (!(form.name ?? "").trim()) {
      setSnackbarMessages(["Tên lớp không được để trống!"]);
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
      return;
    }
    setIsSaving(true);
    try {
      let res;
      if (editClass) {
        res = await classService.updateClass(editClass.id, form);
        setSnackbarMessages([extractMessage(res, "Cập nhật lớp học thành công!")]);
      } else {
        res = await classService.addClass({
          name: form.name,
          description: form.description,
          grade: form.grade,
          require_approval: form.require_approval,
        });
        setSnackbarMessages([extractMessage(res, "Thêm lớp học thành công!")]);
        // lấy mã mời & mở modal join nếu có
        let code: string | null = null;
        // @ts-ignore
        if (typeof res?.data?.data === "string") code = res.data.data;
        // @ts-ignore
        else if (typeof res?.data === "string") code = res.data;
        // @ts-ignore
        else if (typeof res?.data?.code === "string") code = res.data.code;
        if (code) {
          setInviteCode(code);
          setShowJoinModal(true);
        }
      }
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
      fetchClasses();
      handleCloseModal();
    } catch (error: any) {
      const msg = extractMessage(error?.response?.data ?? error?.message, "Lưu lớp học thất bại!");
      setSnackbarMessages([msg]);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      const res = await classService.deleteClass([id]);
      setSnackbarMessages([extractMessage(res, "Xóa lớp học thành công!")]);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
      fetchClasses();
    } catch (e: any) {
      let msg = "Xóa lớp học thất bại!";
      if (e.response && e.response.data) {
        if (Array.isArray(e.response.data.message)) msg = e.response.data.message.join(", ");
        else if (typeof e.response.data.message === "string") msg = e.response.data.message;
        else if (typeof e.response.data === "string") msg = e.response.data;
      }
      setSnackbarMessages([msg]);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
    } finally {
      setDeleteId(null);
    }
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    if (snackbarQueue.length > 0 && snackbarIndex < snackbarQueue.length - 1) {
      setSnackbarIndex((prev) => prev + 1);
      setSnackbarMessages([snackbarQueue[snackbarIndex + 1]]);
      setSnackbarOpen(true);
    } else {
      setSnackbarOpen(false);
      setSnackbarQueue([]);
      setSnackbarIndex(0);
      setSnackbarMessages([]);
    }
  };

  // ===== Join & students modal =====
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<{ id: number; name: string } | null>(null);

  const openInviteModal = (code?: string) => {
    if (!code) return;
    setInviteCode(code);
    setShowJoinModal(true);
  };
  const closeJoinModal = () => {
    setShowJoinModal(false);
    setInviteCode(null);
  };
  const handleViewStudents = (classId: number, className: string) => {
    setSelectedClassForStudents({ id: classId, name: className });
    setShowStudentsModal(true);
  };
  const closeStudentsModal = () => {
    setShowStudentsModal(false);
    setSelectedClassForStudents(null);
  };

  // ===== Requests modal logic =====
  const fetchRequests = async (classId: number, page = 0, size = 10) => {
    setLoadingRequests(true);
    try {
      const res = await classService.getStudentsRequests({ classId, page, size });
      const data = res?.data ?? res;
      setRequests(data?.list ?? []);
      setRequestsTotal(data?.total ?? 0);
      setRequestCounts((prev) => ({ ...prev, [classId]: data?.total ?? 0 }));
    } catch (e) {
      setRequests([]);
      setRequestsTotal(0);
      setSnackbarMessages(["Không thể tải danh sách yêu cầu!"]);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
    } finally {
      setLoadingRequests(false);
    }
  };

  const openRequestsModal = async (classId: number, className: string) => {
    setSelectedClassForRequests({ id: classId, name: className });
    setShowRequestsModal(true);
    setRequestsPage(0);
    setRequestsRowsPerPage(10);
    setSelectedRequestIds([]);
    await fetchRequests(classId, 0, 10);
  };

  const closeRequestsModal = () => {
    setShowRequestsModal(false);
    setSelectedClassForRequests(null);
    setRequests([]);
    setRequestsTotal(0);
    setSelectedRequestIds([]);
  };

  const decideSelected = async (decision: boolean, ids?: number[]) => {
    if (!selectedClassForRequests) return;
    const classId = selectedClassForRequests.id;
    const targetIds = ids && ids.length > 0 ? ids : selectedRequestIds;
    if (targetIds.length === 0) return;

    try {
      setDeciding(true);
      const res = decision
        ? await classService.approveStudents(classId, targetIds)
        : await classService.rejectStudents(classId, targetIds);

      const msg = extractMessage(res, decision ? "Đã phê duyệt yêu cầu thành công" : "Đã từ chối yêu cầu thành công");
      setSnackbarMessages([msg]);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setSnackbarIndex(0);

      await fetchRequests(classId, requestsPage, requestsRowsPerPage);
      setSelectedRequestIds([]);
      await refreshRequestCount(classId);
    } catch (e: any) {
      const msg = extractMessage(e?.response?.data ?? e?.message, "Thao tác thất bại");
      setSnackbarMessages([msg]);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarIndex(0);
    } finally {
      setDeciding(false);
    }
  };

  // ===== Layout components =====
  const lowerCaseRole = role.toLowerCase();

  const Sidebar = lowerCaseRole.includes("lecturer") ? LecturerSidebar : ContentManagerSidebar;
  const Navbar = lowerCaseRole.includes("lecturer") ? LecturerNavbar : ContentManagerNavbar;
  const Footer = lowerCaseRole.includes("lecturer") ? LecturerFooter : ContentManagerFooter;

  // ===== Render =====
  return (
    <>
      <Sidebar onCollapse={setSidebarCollapsed} />
      <Navbar collapsed={sidebarCollapsed} />
      <Footer collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""} bg-gray-50 min-h-screen`}>
        <Container fluid className="py-4">
          <div className="d-flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                <Link
                  component={ReactRouterLink}
                  to={`/${role.includes("lecturer") ? "lecturer" : "content-manager"}/home`}
                  color="inherit"
                  underline="hover"
                >
                  Trang chủ
                </Link>{" "}
                /{" "}
                <Link component={ReactRouterLink} to={location.pathname} color="inherit" underline="hover">
                  Lớp học
                </Link>
              </Typography>
              <h4 className="mb-0">Quản lý Lớp học</h4>
            </div>
            {canEdit && (
              <Button variant="primary" onClick={() => handleShowModal()} className="flex items-center gap-2">
                <FaPlus className="me-2" /> Thêm Lớp
              </Button>
            )}
          </div>

          <div className="mb-3 d-flex gap-2" style={{ maxWidth: 600 }}>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm lớp..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              style={{ maxWidth: 300 }}
            />
            <Form.Select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ maxWidth: 180 }}
            >
              <option value="">Tất cả khối</option>
              <option value={0}>Lớp 10</option>
              <option value={1}>Lớp 11</option>
              <option value={2}>Lớp 12</option>
            </Form.Select>
          </div>

          <TableContainer component={Paper} className="mb-4">
            <Table size="small" aria-label="Danh sách lớp">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  {canEdit && (
                    <TableCell sx={{ fontWeight: "bold", width: 48 }}>
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < classes.length}
                        checked={classes.length > 0 && selected.length === classes.length}
                        onChange={(e) => (e.target.checked ? setSelected(classes.map((c) => c.id)) : setSelected([]))}
                        inputProps={{ "aria-label": "select all classes" }}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Tên lớp</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Mô tả</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Khối</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Giáo viên</TableCell>
                  {canEdit && <TableCell sx={{ fontWeight: "bold", minWidth: 120 }}>Hành động</TableCell>}
                </TableRow>
              </TableHead>

              <TableBody>
                {classes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 7 : 6} align="center">
                      Không có lớp nào
                    </TableCell>
                  </TableRow>
                )}

                {classes.map((cls, idx) => {
                  const isItemSelected = selected.indexOf(cls.id) !== -1;
                  return (
                    <TableRow key={cls.id} hover selected={canEdit && isItemSelected} sx={isItemSelected ? { backgroundColor: "#e3f2fd" } : {}}>
                      {canEdit && (
                        <TableCell>
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={() => {
                              const selectedIndex = selected.indexOf(cls.id);
                              let newSelected: readonly number[] = [];
                              if (selectedIndex === -1) newSelected = [...selected, cls.id];
                              else newSelected = selected.filter((id) => id !== cls.id);
                              setSelected(newSelected);
                            }}
                            inputProps={{ "aria-labelledby": `class-checkbox-${cls.id}` }}
                          />
                        </TableCell>
                      )}
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{cls.name}</TableCell>
                      <TableCell>{cls.description}</TableCell>
                      <TableCell>{gradeMapping[cls.grade] ?? "Không xác định"}</TableCell>
                      <TableCell>{cls.lecturer_name || "-"}</TableCell>

                      {canEdit && (
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Button
                              variant="outlined" 
                              size="sm" 
                              onClick={() => openInviteModal(cls.code)}
                              style={{ minWidth: 32, minHeight: 32, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}
                              title="Hiển thị & sao chép liên kết tham gia"
                            >
                              <LinkIcon fontSize="small" /> 
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => navigate(`/lecturer/classes/${cls.id}`)}
                              target="_blank"
                              style={{ minWidth: 36, minHeight: 32, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}
                              title="Xem chi tiết lớp"
                            >
                              <EyeIcon fontSize="small" />
                            </Button>

                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowModal(cls)}
                              style={{ minWidth: 32, minHeight: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <EditIcon fontSize="small" />
                            </Button>

                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleViewStudents(cls.id, cls.name)}
                              style={{ minWidth: 32, minHeight: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="Xem danh sách học sinh"
                            >
                              <PeopleIcon fontSize="small" />
                            </Button>

                            <Badge badgeContent={requestCounts[cls.id] ?? 0} color="warning" overlap="circular">
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => openRequestsModal(cls.id, cls.name)}
                                style={{ minWidth: 36, minHeight: 32, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", gap: 6 }}
                                title="Xem yêu cầu tham gia lớp"
                              >
                                <GroupAddIcon fontSize="small" />
                                <span className="d-none d-md-inline">Yêu cầu</span>
                              </Button>
                            </Badge>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              disabled={deleteId === cls.id}
                              onClick={() => setConfirmDeleteId(cls.id)}
                              style={{ minWidth: 32, minHeight: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[5, 10, 20, { label: "Tất cả", value: -1 }]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage === 10000 ? -1 : rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Số hàng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`}
            />
          </TableContainer>
        </Container>
      </main>

      {/* Modal Add/Edit */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editClass ? "Chỉnh sửa Lớp" : "Thêm Lớp"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Tên lớp <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                disabled={!canEdit}
                isInvalid={!form.name && formSubmitted ? true : undefined} // Ensure it's boolean
              />
              <Form.Control.Feedback type="invalid">
                Tên lớp không được để trống
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Mô tả
              </Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows={3}
                disabled={!canEdit}
                isInvalid={form.description && form.description.length > 1000 ? true : undefined} // Ensure it's boolean
              />
              <Form.Control.Feedback type="invalid">
                Mô tả không được vượt quá 1000 ký tự
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Khối <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="grade"
                value={form.grade}
                onChange={handleFormChange}
                disabled={!canEdit}
                isInvalid={form.grade === undefined ? true : undefined} // Ensure it's boolean
              >
                <option value={0}>Lớp 10</option>
                <option value={1}>Lớp 11</option>
                <option value={2}>Lớp 12</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Lớp học không hợp lệ
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Tooltip title="Nếu chọn, lớp phải được phê duyệt trước khi sử dụng." arrow>
                <Form.Check
                  type="checkbox"
                  label="Yêu cầu phê duyệt"
                  name="require_approval"
                  checked={form.require_approval}
                  onChange={handleFormChange}
                  disabled={!canEdit}
                />
              </Tooltip>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Hủy
          </Button>
          {canEdit && (
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal show={!!confirmDeleteId && canEdit} onHide={() => setConfirmDeleteId(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmDeleteId === -1 ? `Bạn có chắc chắn muốn xóa ${selected.length} lớp đã chọn?` : `Bạn có chắc chắn muốn xóa lớp này?`}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (confirmDeleteId === -1) {
                await Promise.all(selected.map((id) => handleDelete(id)));
                setSelected([]);
              } else if (confirmDeleteId !== null) {
                await handleDelete(confirmDeleteId);
              }
              setConfirmDeleteId(null);
            }}
          >
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Join */}
      <Modal show={showJoinModal} onHide={closeJoinModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chia sẻ liên kết tham gia lớp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {inviteCode ? (
            <>
              <div className="mb-3">
                <Form.Label>Mã lời mời</Form.Label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Form.Control value={inviteCode} readOnly style={{ maxWidth: 260 }} />
                  <Button
                    variant="outline-primary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteCode);
                        setSnackbarMessages([`Đã sao chép mã: ${inviteCode}`]);
                        setSnackbarSeverity("success");
                        setSnackbarOpen(true);
                        setSnackbarIndex(0);
                      } catch {
                        setSnackbarMessages(["Không thể sao chép vào clipboard"]);
                        setSnackbarSeverity("warning");
                        setSnackbarOpen(true);
                        setSnackbarIndex(0);
                      }
                    }}
                  >
                    Sao chép mã
                  </Button>
                </div>
                <Form.Text className="text-muted">Bạn có thể gửi trực tiếp mã này cho học sinh.</Form.Text>
              </div>

              <div className="mb-2">
                <Form.Label>Liên kết tham gia</Form.Label>
                <Form.Control value={`http://localhost:5173/join?code=${inviteCode}`} readOnly />
                <div className="mt-2 d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`http://localhost:5173/join?code=${inviteCode}`);
                        setSnackbarMessages(["Đã sao chép liên kết tham gia"]);
                        setSnackbarSeverity("success");
                        setSnackbarOpen(true);
                        setSnackbarIndex(0);
                      } catch {
                        setSnackbarMessages(["Không thể sao chép vào clipboard"]);
                        setSnackbarSeverity("warning");
                        setSnackbarOpen(true);
                        setSnackbarIndex(0);
                      }
                    }}
                  >
                    Sao chép liên kết
                  </Button>
                  <Button variant="outline-secondary" as="a" href={`http://localhost:5173/join?code=${inviteCode}`} target="_blank" rel="noreferrer">
                    Mở liên kết
                  </Button>
                </div>
                <Form.Text className="text-muted">Học sinh chỉ cần mở liên kết này; hệ thống sẽ tự động ghi danh vào lớp.</Form.Text>
              </div>
            </>
          ) : (
            <Alert severity="info">Chưa có mã lời mời để tạo liên kết.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeJoinModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Students Modal */}
      {showStudentsModal && selectedClassForStudents && (
        <ViewStudentsModal show={showStudentsModal} onHide={closeStudentsModal} classId={selectedClassForStudents.id} className={selectedClassForStudents.name} />
      )}

      {/* Modal danh sách yêu cầu */}
      <Modal show={showRequestsModal} onHide={closeRequestsModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Yêu cầu tham gia{selectedClassForRequests ? ` - ${selectedClassForRequests.name}` : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingRequests ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : requests.length === 0 ? (
            <Alert severity="info">Không có yêu cầu nào.</Alert>
          ) : (
            <TableContainer component={Paper} className="mb-2">
              <Table size="small" aria-label="Danh sách yêu cầu">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ width: 48 }}>
                      <Checkbox
                        color="primary"
                        indeterminate={selectedRequestIds.length > 0 && selectedRequestIds.length < requests.length}
                        checked={requests.length > 0 && selectedRequestIds.length === requests.length}
                        onChange={(e) => setSelectedRequestIds(e.target.checked ? requests.map((s) => s.id) : [])}
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Ngày sinh</TableCell>
                    <TableCell>Khối</TableCell>
                    <TableCell>Giới tính</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((s, idx) => {
                    const checked = selectedRequestIds.includes(s.id);
                    return (
                      <TableRow key={s.id} hover selected={checked}>
                        <TableCell>
                          <Checkbox
                            color="primary"
                            checked={checked}
                            onChange={() =>
                              setSelectedRequestIds((prev) => (prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]))
                            }
                          />
                        </TableCell>
                        <TableCell>{requestsPage * requestsRowsPerPage + idx + 1}</TableCell>
                        <TableCell>{s.full_name ?? "-"}</TableCell>
                        <TableCell>{s.username ?? "-"}</TableCell>
                        <TableCell>{s.email ?? "-"}</TableCell>
                        <TableCell>{s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "-"}</TableCell>
                        <TableCell>{typeof s.grade === "number" ? gradeMapping[s.grade] ?? s.grade : "-"}</TableCell>
                        <TableCell>{typeof s.gender === "number" ? s.gender : "-"}</TableCell>
                        <TableCell>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Tooltip title="Phê duyệt">
                              <span>
                                <IconButton size="small" color="success" disabled={deciding} onClick={() => decideSelected(true, [s.id])}>
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Từ chối">
                              <span>
                                <IconButton size="small" color="error" disabled={deciding} onClick={() => decideSelected(false, [s.id])}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Modal.Body>
        <Modal.Footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="d-flex align-items-center gap-3">
            <Typography variant="body2" className="mb-0">
              Tổng: <b>{requestsTotal}</b>
            </Typography>
            <Typography variant="body2" className="mb-0">
              Đã chọn: <b>{selectedRequestIds.length}</b>
            </Typography>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button variant="outline-danger" onClick={() => decideSelected(false)} disabled={selectedRequestIds.length === 0 || deciding}>
              {deciding ? "Đang từ chối..." : "Từ chối đã chọn"}
            </Button>
            <Button variant="primary" onClick={() => decideSelected(true)} disabled={selectedRequestIds.length === 0 || deciding}>
              {deciding ? "Đang phê duyệt..." : "Phê duyệt đã chọn"}
            </Button>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <TablePagination
              component="div"
              rowsPerPageOptions={[5, 10, 20]}
              count={requestsTotal}
              rowsPerPage={requestsRowsPerPage}
              page={requestsPage}
              onPageChange={async (_e, newPage) => {
                setRequestsPage(newPage);
                if (selectedClassForRequests) {
                  await fetchRequests(selectedClassForRequests.id, newPage, requestsRowsPerPage);
                  setSelectedRequestIds([]);
                }
              }}
              onRowsPerPageChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                const newSize = parseInt(e.target.value, 10);
                setRequestsRowsPerPage(newSize);
                setRequestsPage(0);
                if (selectedClassForRequests) {
                  await fetchRequests(selectedClassForRequests.id, 0, newSize);
                  setSelectedRequestIds([]);
                }
              }}
              labelRowsPerPage="Số hàng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`}
            />
          </div>
        </Modal.Footer>
      </Modal>
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết lớp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetail ? (
            <div className="text-center py-3">Đang tải...</div>
          ) : classDetail ? (
            <div className="d-grid gap-2">
              {/* <div><b>ID:</b> {classDetail.id}</div> */}
              <div><b>Tên lớp:</b> {classDetail.name}</div>
              <div><b>Mã tham gia:</b> {classDetail.code}</div>
              <div><b>Mô tả:</b> {classDetail.description || "-"}</div>
              <div><b>Khối:</b> {gradeMapping[classDetail.grade] ?? classDetail.grade}</div>
              <hr className="my-2" />
              <div><b>GV phụ trách (ID):</b> {classDetail.lecturer_id}</div>
              <div><b>GV phụ trách (Tên):</b> {classDetail.lecturer_name}</div>
              <div><b>Email GV:</b> {classDetail.lecturer_email}</div>
              <div><b>SĐT GV:</b> {classDetail.lecturer_mobile}</div>
            </div>
          ) : (
            <Alert severity="warning">Không có dữ liệu chi tiết.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Đóng</Button>
        </Modal.Footer>
      </Modal>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "top", horizontal: "right" }} sx={{ top: { xs: 70, sm: 70 } }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessages[0]}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ClassList;
