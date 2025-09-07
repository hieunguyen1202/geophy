import React, { useState, useEffect } from 'react';
import { Card, Tab, Tabs, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Modal } from 'react-bootstrap';
import { FaSearch, FaEdit, FaTrash, FaEye, FaFileImport } from 'react-icons/fa';
import userService from '../../services/userService';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminFooter from '../../components/admin/AdminFooter';
import ExcelImport from './ExcelImport';
import { useLocation, Link as ReactRouterLink } from 'react-router-dom';
import { listMenuAdmin } from '../../config';
import Link from '@mui/material/Link';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import '../../styles/sidebar.css';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

interface Student {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

interface Lecturer {
  id: number;
  name: string;
  email: string;
  gender: number;
  role: number;
  status: number;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [contentManagers, setContentManagers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  // DELETE state
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null; name: string }>({
    show: false,
    id: null,
    name: "",
  });
  const [deleting, setDeleting] = useState(false);

  // Mở modal xác nhận
  const openDeleteConfirm = (id: number, name?: string) => {
    setDeleteConfirm({ show: true, id, name: name || "" });
  };

  // Gọi API xoá
  const doDeleteUser = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      // yêu cầu: đã implement userService.deleteUsers([id])
      await userService.deleteUsers([deleteConfirm.id]);

      setSnackMsg('Xóa người dùng thành công');
      setSnackSeverity('success');
      setSnackOpen(true);

      // refresh tab hiện tại
      if (activeTab === 'students') await fetchStudents(currentPage);
      else if (activeTab === 'lecturers') await fetchLecturers(currentPage);
      else await fetchContentManagers(currentPage);

      setDeleteConfirm({ show: false, id: null, name: "" });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Xóa người dùng thất bại';
      setSnackMsg(msg);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setDeleting(false);
    }
  };

  // Lấy danh sách Học sinh
  const fetchStudents = async (page = 0, size = 10000) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getStudents({ page, size });
      setStudents(response.data.list || []);
      setTotalPages(response.totalPages || 0);
    } catch (err) {
      setError('Không thể lấy danh sách Học sinh');
      console.error('Lỗi khi lấy danh sách Học sinh:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách giáo viên với role = 2
  const fetchLecturers = async (page = 0, size = 10000) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getLecturers({
        page,
        size,
        role: 2
      });
      setLecturers(response.data.list || []);
      setTotalPages(Math.ceil((response.data.total || 0) / size));
    } catch (err) {
      setError('Không thể lấy danh sách ');
      console.error('Lỗi khi lấy danh sách :', err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách quản lý nội dung với role = 1
  const fetchContentManagers = async (page = 0, size = 10000) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getLecturers({
        page,
        size,
        role: 1
      });
      setContentManagers(response.data.list || []);
      setTotalPages(Math.ceil((response.data.total || 0) / size));
    } catch (err) {
      setError('Không thể lấy danh sách quản lý nội dung');
      console.error('Lỗi khi lấy danh sách quản lý nội dung:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents(currentPage);
    } else if (activeTab === 'lecturers') {
      fetchLecturers(currentPage);
    } else if (activeTab === 'content-managers') {
      fetchContentManagers(currentPage);
    }
  }, [activeTab, currentPage]);

  const handleTabChange = (tab: string | null) => {
    if (tab) {
      setActiveTab(tab);
      setCurrentPage(0);
      setSearchTerm('');
    }
  };
  const openEditUser = (id: number) => {
    setEditUserId(id);
    setShowEditModal(true);
  };
  const handleSearch = () => {
    setCurrentPage(0);
    if (activeTab === 'students') {
      fetchStudents(0);
    } else if (activeTab === 'lecturers') {
      fetchLecturers(0);
    } else if (activeTab === 'content-managers') {
      fetchContentManagers(0);
    }
  };

  const getStatusBadge = (status: number | string) => {
    const statusValue = typeof status === 'string' ? parseInt(status) : status;
    switch (statusValue) {
      case 0:
        return <Badge bg="success">Kích hoạt</Badge>;
      case 1:
        return <Badge bg="danger">Chưa kích hoạt</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  const getGenderText = (gender: number) => {
    return gender === 1 ? 'Nam' : gender === 0 ? 'Nữ' : 'Khác';
  };

  const getRoleText = (role: number) => {
    switch (role) {
      case 0: return 'Quản trị viên';
      case 1: return 'Quản lý nội dung';
      case 2: return 'Giáo viên';
      case 3: return 'Học sinh';
      default: return 'Khác';
    }
  };

  const openUserDetail = async (id: number) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    try {
      const res = await userService.getUserById(id);
      setDetailData(res?.data ?? null);
    } catch (e: any) {
      setDetailError(e?.response?.data?.message || e?.message || 'Lỗi không xác định');
    } finally {
      setDetailLoading(false);
    }
  };

  const renderStudentsTable = () => (
    <Table responsive hover className="mb-0">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Tên</th>
          <th>Email</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => {
          const statusValue =
            typeof student.status === 'string'
              ? parseInt(student.status, 10)
              : (student.status as number);
          const isActive = statusValue === 1;

          return (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.name ? student.name : '-'}</td>
              <td>{student.email}</td>
              <td>{getStatusBadge(student.status)}</td>
              <td>{new Date(student.createdAt).toLocaleDateString()}</td>
              <td>
                {isActive && (
                  <>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => openUserDetail(student.id)}>
                      <FaEye />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="me-2"
                      onClick={() => openEditUser(student.id)}>
                      <FaEdit />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => openDeleteConfirm(student.id, student.name)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const renderLecturersTable = () => (
    <Table responsive hover className="mb-0">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Tên</th>
          <th>Email</th>
          <th>Giới tính</th>
          <th>Chức vụ</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {lecturers.map((lecturer) => {
          const statusValue =
            typeof lecturer.status === 'string'
              ? parseInt(lecturer.status, 10)
              : (lecturer.status as number);
          const isActive = statusValue === 1;

          return (

            <tr key={lecturer.id}>
              <td>{lecturer.id}</td>
              <td>{lecturer.name ? lecturer.name : '-'}</td>
              <td>{lecturer.email}</td>
              <td>{getGenderText(lecturer.gender)}</td>
              <td>{getRoleText(lecturer.role)}</td>
              <td>{getStatusBadge(lecturer.status)}</td>
              <td>{new Date(lecturer.createdAt).toLocaleDateString()}</td>
              <td>
                {isActive && (
                  <>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => openUserDetail(lecturer.id)}
                    >
                      <FaEye />
                    </Button>
                    <Button variant="outline-warning" size="sm" className="me-2" onClick={() => openEditUser(lecturer.id)} >
                      <FaEdit />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => openDeleteConfirm(lecturer.id, lecturer.name)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const renderContentManagersTable = () => (
    <Table responsive hover className="mb-0">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Tên</th>
          <th>Email</th>
          <th>Giới tính</th>
          <th>Chức vụ</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {contentManagers.map((manager) => {
          const statusValue =
            typeof manager.status === 'string'
              ? parseInt(manager.status, 10)
              : (manager.status as number);
          const isActive = statusValue === 1;

          return (

            <tr key={manager.id}>
              <td>{manager.id}</td>
              <td>{manager.name ? manager.name : '-'}</td>
              <td>{manager.email}</td>
              <td>{getGenderText(manager.gender)}</td>
              <td>{getRoleText(manager.role)}</td>
              <td>{getStatusBadge(manager.status)}</td>
              <td>{new Date(manager.createdAt).toLocaleDateString()}</td>
              <td>
                {isActive && (
                  <>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => openUserDetail(manager.id)}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="me-2"
                      onClick={() => openEditUser(manager.id)}
                    >
                      <FaEdit />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => openDeleteConfirm(manager.id, manager.name)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const renderPagination = () => (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div>
        Hiện đang ở trang {currentPage + 1} của {totalPages}
      </div>
      <div>
        <Button
          variant="outline-primary"
          size="sm"
          className="me-2"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Trước
        </Button>
        <Button
          variant="outline-primary"
          size="sm"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Tiếp theo
        </Button>
      </div>
    </div>
  );

  // --- AddUserModal ---
  // --- AddUserModal (đã sửa theo service addUser/addUsers) ---
const AddUserModal: React.FC<{
  show: boolean;
  onClose: () => void;
  onCreated: () => void;
}> = ({ show, onClose, onCreated }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<number>(3);
  const [grade, setGrade] = useState<number | null>(null);
  const [subject, setSubject] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

  const roleOptions = [
    { value: 1, label: 'Quản lý nội dung' },
    { value: 2, label: 'Giáo viên' },
    { value: 3, label: 'Học sinh' },
  ];

  // Map grade theo chuẩn hệ thống (0:10, 1:11, 2:12)
  const gradeOptions = [
    { value: 0, label: 'Lớp 10' },
    { value: 1, label: 'Lớp 11' },
    { value: 2, label: 'Lớp 12' },
  ];

  // Map subject theo chuẩn hệ thống (0:Toán, 1:Vật lý) — điều chỉnh nếu backend khác
  const subjectOptions = [
    { value: 0, label: 'Toán học' },
    { value: 1, label: 'Vật lý' },
  ];

  // Reset các field phụ khi đổi role để tránh gửi sai
  useEffect(() => {
    if (role === 3) {
      // Học sinh: cần grade, bỏ subject
      setSubject(null);
    } else if (role === 1 || role === 2) {
      // QL nội dung / Giáo viên: cần subject, bỏ grade
      setGrade(null);
    } else {
      setGrade(null);
      setSubject(null);
    }
  }, [role]);

  const submit = async () => {
    setError(null);

    // Validate client-side đúng như logic service
    if (!EMAIL_RE.test(email.trim())) {
      setError('Email không hợp lệ');
      return;
    }
    if (![1, 2, 3].includes(role)) {
      setError('Role không hợp lệ');
      return;
    }
    if (role === 3 && (grade === null || grade === undefined)) {
      setError('Học sinh (role=3) bắt buộc có grade');
      return;
    }
    if ((role === 1 || role === 2) && (subject === null || subject === undefined)) {
      setError('Vai trò 1/2 bắt buộc có subject');
      return;
    }

    setSaving(true);
    try {
      // Tạo payload đúng schema; field không cần để undefined
      const payload = {
        email: email.trim(),
        role: role as 1 | 2 | 3,
        grade: role === 3 ? (grade as number) : undefined,
        subject: role === 1 || role === 2 ? (subject as number) : undefined,
      };

      // Gọi service mới (addUser sẽ wrap addUsers)
      await userService.addUser(payload);

      // Reset form
      setEmail('');
      setRole(3);
      setGrade(null);
      setSubject(null);

      onCreated();
      onClose();
    } catch (e: any) {
      // Service đã chuẩn hoá error bằng extractErrorMessage -> e.message
      const msg =
        e?.response?.data?.message
          ? Array.isArray(e.response.data.message)
            ? e.response.data.message.join('\n')
            : e.response.data.message
          : e?.message || 'Lỗi không xác định';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Thêm người dùng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="mb-3" style={{ whiteSpace: 'pre-line' }}>{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Chức vụ</Form.Label>
          <Form.Select
            value={role}
            onChange={(e) => setRole(Number(e.target.value))}
            disabled={saving}
          >
            {roleOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Form.Select>
        </Form.Group>

        {role === 3 && (
          <Form.Group className="mb-3">
            <Form.Label>Khối/Lớp <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={grade === null || grade === undefined ? '' : String(grade)}
              onChange={(e) => {
                const v = e.target.value;
                setGrade(v === '' ? null : Number(v));
              }}
              disabled={saving}
            >
              <option value="">-- Chọn khối/lớp --</option>
              {gradeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        {(role === 1 || role === 2) && (
          <Form.Group className="mb-2">
            <Form.Label>Môn học <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={subject === null || subject === undefined ? '' : String(subject)}
              onChange={(e) => {
                const v = e.target.value;
                setSubject(v === '' ? null : Number(v));
              }}
              disabled={saving}
            >
              <option value="">-- Chọn môn học --</option>
              {subjectOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Thêm'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

  // --- DetailUserModal ---
  const DetailUserModal: React.FC<{
    show: boolean;
    loading: boolean;
    error: string | null;
    data: any | null;
    onClose: () => void;
  }> = ({ show, loading, error, data, onClose }) => {
    const safeFullName = (name: any) => {
      if (name == null || String(name).includes('null null')) return '-';
      const s = String(name).trim();
      return s ? s : '-';
    };

    const gradeLabel = (grade: any) => {
      const g = typeof grade === 'string' ? parseInt(grade, 10) : grade;
      const map: Record<number, string> = { 0: 'Lớp 10', 1: 'Lớp 11', 2: 'Lớp 12' };
      return map[g] ?? '-';
    };

    return (
      <Modal show={show} onHide={onClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading && <div>Đang tải...</div>}
          {!loading && error && <Alert variant="danger">{error}</Alert>}
          {!loading && !error && data && (
            <Table borderless size="sm" className="mb-0">
              <tbody>
                {/* <tr><td className="fw-semibold">ID</td><td>{data.id}</td></tr> */}
                <tr><td className="fw-semibold">Username</td><td>{data.username ?? '-'}</td></tr>
                <tr><td className="fw-semibold">Họ tên</td><td>{safeFullName(data.full_name)}</td></tr>
                <tr><td className="fw-semibold">Email</td><td>{data.email ?? '-'}</td></tr>
                <tr><td className="fw-semibold">Điện thoại</td><td>{data.mobile ?? '-'}</td></tr>
                <tr><td className="fw-semibold">Giới tính</td><td>{data.gender === 1 ? 'Nam' : data.gender === 0 ? 'Nữ' : 'Khác'}</td></tr>
                <tr><td className="fw-semibold">Ngày sinh</td><td>{data.dob ?? '-'}</td></tr>
                <tr><td className="fw-semibold">Khối/Lớp</td><td>{gradeLabel(data.grade)}</td></tr>
                <tr><td className="fw-semibold">Vai trò</td><td>{data.role === 1 ? 'Quản lý nội dung' : data.role === 2 ? 'Giáo viên' : data.role === 3 ? 'Học sinh' : 'Khác'}</td></tr>
                <tr><td className="fw-semibold">Trạng thái</td><td>{data.status === 1 ? 'Hoạt động' : 'Không hoạt động'}</td></tr>
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    );
  };
  type EditUserModalProps = {
    show: boolean;
    userId: number | null;
    onClose: () => void;
    onSaved: (message?: string) => void;
    onError: (message?: string) => void;
  };

  const EditUserModal: React.FC<EditUserModalProps> = ({ show, userId, onClose, onSaved, onError }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // form fields
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [roleId, setRoleId] = useState<number>(3);
    const [status, setStatus] = useState<number>(1);

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    const roleOptions = [
      { value: 1, label: 'Quản lý nội dung' },
      { value: 2, label: 'Giáo viên' },
      { value: 3, label: 'Học sinh' },
    ];

    const statusOptions = [
      { value: 0, label: 'Không hoạt động' },
      { value: 1, label: 'Hoạt động' },
    ];

    // Fetch chi tiết khi mở modal
    useEffect(() => {
      if (!show || !userId) return;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await userService.getUserById(userId);
          const d = res?.data || {};
          setEmail(d.email ?? '');
          setPhone(d.phone ?? d.mobile ?? '');
          setRoleId(typeof d.role === 'number' ? d.role : 3);
          setStatus(typeof d.status === 'number' ? d.status : 1);
        } catch (e: any) {
          const msg = e?.response?.data?.message || e?.message || 'Lỗi khi tải thông tin người dùng';
          setError(msg);
        } finally {
          setLoading(false);
        }
      })();
    }, [show, userId]);

    const submit = async () => {
      setError(null);
      if (!userId) return;
      if (!EMAIL_RE.test(email.trim())) {
        setError('Email không hợp lệ');
        return;
      }
      if (![1, 2, 3].includes(roleId)) {
        setError('Role không hợp lệ');
        return;
      }
      setSaving(true);
      try {
        await userService.updateUser(userId, {
          role_id: roleId,
          status,
          email: email.trim(),
          phone: phone.trim(),
        });
        onSaved('Cập nhật người dùng thành công');
        onClose();
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Cập nhật thất bại';
        setError(msg);
        onError(msg);
      } finally {
        setSaving(false);
      }
    };

    return (
      <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sửa người dùng {userId ? `#${userId}` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading && <Alert variant="info">Đang tải dữ liệu...</Alert>}
          {!loading && error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Điện thoại</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  disabled={saving}
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  disabled={saving}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button variant="primary" onClick={submit} disabled={saving || loading || !userId}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <AdminSidebar onCollapse={setSidebarCollapsed} />
      <AdminNavbar collapsed={sidebarCollapsed} />
      <AdminFooter collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="mb-6 mt-2">
          <Breadcrumbs aria-label="breadcrumb" className="mb-2">
            <Link component={ReactRouterLink} to="/admin/dashboard" color="inherit" underline="hover">
              Quản trị viên
            </Link>
            <Link component={ReactRouterLink} to={location.pathname} color="text.primary" underline="hover" aria-current="page">
              {listMenuAdmin.find(item => item.path === location.pathname)?.name || 'Quản lý người dùng'}
            </Link>
          </Breadcrumbs>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Quản lý người dùng</h2>
            <p className="text-muted mb-0">Quản lý Học sinh, giáo viên và quản lý nội dung</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => setShowImportModal(true)}>
              <FaFileImport className="me-2" />
              Nhập Excel
            </Button>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Thêm người dùng mới
            </Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <Card.Header className="bg-white border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabChange}
                className="border-0"
              >
                <Tab eventKey="students" title="Học sinh" />
                <Tab eventKey="lecturers" title="Giáo viên" />
                <Tab eventKey="content-managers" title="Quản lý nội dung" />
              </Tabs>

              <div className="d-flex align-items-center">
                <InputGroup style={{ width: '300px' }}>
                  <Form.Control
                    type="text"
                    placeholder={`Tìm kiếm ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // FIX: onKeyDown
                  />
                  <Button variant="outline-secondary" onClick={handleSearch}>
                    <FaSearch />
                  </Button>
                </InputGroup>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-0">
            {error && (
              <Alert variant="danger" className="m-3 mb-0">
                {error}
              </Alert>
            )}

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </Spinner>
              </div>
            ) : (
              <>
                {activeTab === 'students' ? renderStudentsTable() :
                  activeTab === 'lecturers' ? renderLecturersTable() :
                    renderContentManagersTable()}
                {!loading && ((activeTab === 'students' && students.length === 0) ||
                  (activeTab === 'lecturers' && lecturers.length === 0) ||
                  (activeTab === 'content-managers' && contentManagers.length === 0)) && (
                    <div className="text-center py-5 text-muted">
                      Không tìm thấy {activeTab}
                    </div>
                  )}
                {(students.length > 0 || lecturers.length > 0 || contentManagers.length > 0) && renderPagination()}
              </>
            )}
          </Card.Body>
        </Card>
      </main>

      {/* Excel Import Modal */}
      <ExcelImport
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        onSuccess={() => {
          // Refresh data after successful import
          if (activeTab === 'students') {
            fetchStudents(currentPage);
          } else if (activeTab === 'lecturers') {
            fetchLecturers(currentPage);
          } else if (activeTab === 'content-managers') {
            fetchContentManagers(currentPage);
          }
        }}
      />

      {/* Modal: Thêm người dùng */}
      <AddUserModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={() => {
          setSnackMsg('Thêm người dùng thành công');
          setSnackSeverity('success');
          setSnackOpen(true);
          if (activeTab === 'students') fetchStudents(currentPage);
          else if (activeTab === 'lecturers') fetchLecturers(currentPage);
          else fetchContentManagers(currentPage);
        }}
      />

      {/* Modal: Xem chi tiết */}
      <DetailUserModal
        show={showDetailModal}
        loading={detailLoading}
        error={detailError}
        data={detailData}
        onClose={() => setShowDetailModal(false)}
      />
      <EditUserModal
        show={showEditModal}
        userId={editUserId}
        onClose={() => setShowEditModal(false)}
        onSaved={(msg) => {
          setSnackMsg(msg || 'Cập nhật người dùng thành công');
          setSnackSeverity('success');
          setSnackOpen(true);
          // refresh tab hiện tại
          if (activeTab === 'students') fetchStudents(currentPage);
          else if (activeTab === 'lecturers') fetchLecturers(currentPage);
          else fetchContentManagers(currentPage);
        }}
        onError={(msg) => {
          setSnackMsg(msg || 'Cập nhật thất bại');
          setSnackSeverity('error');
          setSnackOpen(true);
        }}
      />
      {/* Modal: Xác nhận xoá */}
      <Modal
        show={deleteConfirm.show}
        onHide={() => setDeleteConfirm({ show: false, id: null, name: "" })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xoá người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc muốn xoá
          {deleteConfirm.name ? <> người dùng <strong>{deleteConfirm.name}</strong></> : " người dùng"}
          {deleteConfirm.id ? <> (ID: <strong>{deleteConfirm.id}</strong>)</> : null}
          ? Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteConfirm({ show: false, id: null, name: "" })}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button variant="danger" onClick={doDeleteUser} disabled={deleting}>
            {deleting ? "Đang xoá..." : "Xoá"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert onClose={() => setSnackOpen(false)} severity={snackSeverity} variant="filled" sx={{ width: '100%' }}>
          {snackMsg}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

export default UserManagement;
