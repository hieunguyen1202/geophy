import React, { useEffect, useMemo, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import {
  Card, CardContent, Chip, Typography, TextField,
  Select, FormControl, InputLabel, Snackbar, Alert, MenuItem, Button
} from '@mui/material';
import { green, orange, blueGrey } from "@mui/material/colors";
import { MdGroups, MdLock, MdCheckCircle, MdRefresh } from "react-icons/md";

import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import type { BaseListMenu } from "../../types";
import classService from "../../services/classService";
import { Link as RouterLink } from "react-router-dom";

type ClassItem = {
  id: number;
  name: string;
  code: string;
  description?: string;
  grade: number;          // 0: 10, 1: 11, 2: 12
  lecturer_id: number;
  lecturer_name: string;
  require_approval: boolean;
};

const gradeLabels: Record<number, string> = { 0: "Lớp 10", 1: "Lớp 11", 2: "Lớp 12" };

const gradeOptions = [
  { value: "", label: "Tất cả khối" },
  { value: "0", label: "Lớp 10" },
  { value: "1", label: "Lớp 11" },
  { value: "2", label: "Lớp 12" },
];

interface StudentClassesPageProps {
  listMenuUser: BaseListMenu[];
}

const StudentClassesPage: React.FC<StudentClassesPageProps> = ({ listMenuUser }) => {
  // Filters
  const [name, setName] = useState<string>("");
  const [grade, setGrade] = useState<string>("");

  // Data / UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [_total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info" | "warning">("info");

  const showSnack = (msg: string, severity: typeof snackSeverity = "info") => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await classService.getClasses({
        page: 0,
        size: 50000,
        name: name.trim(),
        grade: grade,
        lecturer_name: "",
        lecturer_id: "",
      });

      const list: ClassItem[] =
        (res?.data?.list as ClassItem[]) ??
        (res?.list as ClassItem[]) ??
        ([] as ClassItem[]);

      setClasses(list || []);
      setTotal(typeof res?.data?.total === "number" ? res.data.total : (res?.total ?? list?.length ?? 0));
    } catch (err: unknown) {
      console.error(err);
      setError("Không thể tải danh sách lớp học");
      showSnack("Không thể tải danh sách lớp học", "error");
      setClasses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply client filters (in addition to server filters)
  const filtered = useMemo(() => {
    const byName = name.trim().toLowerCase();
    return (classes || []).filter((c) => {
      const matchName = !byName || c.name.toLowerCase().includes(byName);
      const matchGrade = grade === "" || String(c.grade) === grade;
      return matchName && matchGrade;
    });
  }, [classes, name, grade]);

  // Split into two sections
  const { quickJoin, needApproval } = useMemo(() => {
    // De-duplicate (handle accidental duplicates from API)
    const map = new Map<string, ClassItem>(); // key = id|code
    for (const c of filtered) {
      map.set(`${c.id}|${c.code}`, c);
    }
    const uniq = Array.from(map.values());
    return {
      quickJoin: uniq.filter((c) => !c.require_approval),
      needApproval: uniq.filter((c) => c.require_approval),
    };
  }, [filtered]);

  const SectionHeader: React.FC<{ title: string; count: number; icon?: React.ReactNode; badgeColor?: string }> = ({
    title,
    count,
    icon,
    badgeColor = blueGrey[600],
  }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <Typography variant="h6" className="font-semibold text-gray-800">
          {title}
        </Typography>
      </div>
      <Chip label={`${count} lớp`} size="small" sx={{ backgroundColor: badgeColor, color: "#fff" }} />
    </div>
  );

  const ClassCard: React.FC<{ cls: ClassItem }> = ({ cls }) => {
    // Không dùng enrollment_status, hiển thị nhãn theo require_approval
    const statusChip = cls.require_approval ? (
      <Chip
        size="small"
        color="warning"
        icon={<MdLock />}
        label="Chờ xác nhận"
        sx={{ fontWeight: 600 }}
      />
    ) : (
      <Chip
        size="small"
        color="success"
        icon={<MdCheckCircle />}
        label="Đã tham gia"
        sx={{ fontWeight: 600 }}
      />
    );

    return (
      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          transition: 'all 0.3s ease',
          '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
        }}
        className="w-full"
      >
        <CardContent sx={{ p: 3 }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Typography
                component={RouterLink}
                to={`/student/classes/${cls.id}`}
                variant="h6"
                className="font-bold text-gray-800 mb-2 line-clamp-1"
                style={{ textDecoration: "none" }}
              >
                {cls.name}
              </Typography>
              <div className="flex flex-wrap gap-2">
                <Chip size="small" label={gradeLabels[cls.grade] ?? `Khối ${cls.grade}`} />
                <Chip
                  size="small"
                  color="primary"
                  icon={<MdGroups />}
                  label={cls.lecturer_name}
                  variant="outlined"
                />
                {statusChip}
              </div>
            </div>
          </div>

          {/* Không hiển thị mã lớp / lời mời / nút tham gia */}
          {cls.description && (
            <Typography variant="body2" color="text.secondary" className="mt-3 line-clamp-2">
              {cls.description}
            </Typography>
          )}
          <Button
            component={RouterLink}
            to={`/student/classes/${cls.id}`}
            variant="outlined"
            size="small"
            sx={{ mt: 2 }}
          >
            Xem chi tiết
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar listMenuUser={listMenuUser} />

      <Container className="py-8 flex-grow mt-4">
        {/* Header + Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <Typography variant="caption" color="textSecondary" className="block">
              Trang chủ / Lớp học
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
              Danh sách lớp học
            </Typography>
          </div>

          <div className="flex items-center gap-2">
            <TextField
              size="small"
              label="Tìm theo tên lớp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ minWidth: 220 }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="grade-filter">Khối lớp</InputLabel>
              <Select
                labelId="grade-filter"
                label="Khối lớp"
                value={grade}
                onChange={(e) => setGrade(e.target.value as string)}
              >
                {gradeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <button
              className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-gray-100"
              onClick={fetchClasses}
              type="button"
            >
              <MdRefresh /> Tải lại
            </button>
          </div>
        </div>

        {/* Loading / Error */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner animation="border" role="status" />
            <span className="ms-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <Typography color="error" variant="body1">{error}</Typography>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Quick join (ở đây hiểu là lớp không yêu cầu phê duyệt → đang “đã tham gia”) */}
            {/* Đã tham gia */}
            <section className="mt-3">
              <SectionHeader
                title="Đã tham gia"
                count={quickJoin.length}
                icon={<MdCheckCircle className="text-green-600" size={22} />}
                badgeColor={green[600]}
              />
              {quickJoin.length === 0 ? (
                <div className="text-center py-8">
                  <Typography variant="body2" color="text.secondary" className="italic">
                    Không có lớp đã tham gia.
                  </Typography>
                </div>
              ) : (
                // 👇 Cố định 3 cột
                <div className="grid grid-cols-3 gap-4">
                  {quickJoin.map((cls) => (
                    <ClassCard key={`joined-${cls.id}-${cls.code}`} cls={cls} />
                  ))}
                </div>
              )}
            </section>

            {/* Chờ xác nhận */}
            <section className="mt-4">
              <SectionHeader
                title="Chờ xác nhận"
                count={needApproval.length}
                icon={<MdLock className="text-orange-600" size={22} />}
                badgeColor={orange[700]}
              />
              {needApproval.length === 0 ? (
                <div className="text-center py-8">
                  <Typography variant="body2" color="text.secondary" className="italic">
                    Không có lớp chờ xác nhận.
                  </Typography>
                </div>
              ) : (
                // 👇 Cố định 3 cột
                <div className="grid grid-cols-3 gap-4">
                  {needApproval.map((cls) => (
                    <ClassCard key={`pending-${cls.id}-${cls.code}`} cls={cls} />
                  ))}
                </div>
              )}
            </section>


          </div>
        )}

        {/* Footer meta */}
        {!loading && !error && (
          <div className="mt-8 pt-4 border-t border-gray-200 mb-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              {/* <span>
                Tổng số lớp: <span className="font-semibold text-gray-700">{total}</span>
              </span> */}
              <span>
                Đã tham gia: <span className="font-semibold text-green-600">{quickJoin.length}</span> |{" "}
                Chờ xác nhận: <span className="font-semibold text-orange-600">{needApproval.length}</span>
              </span>
            </div>
          </div>
        )}
      </Container>

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

export default StudentClassesPage;
