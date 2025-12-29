"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type StudentStatus = "Enrolled" | "Active" | "Completed";

type Student = {
  id: string;
  name: string;
  email: string;
  courseId?: string;
  courseName?: string;
  status: StudentStatus;
};

type Course = {
  id: string;
  name: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  /* ---------------- Fetch Data ---------------- */

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  async function fetchStudents() {
    const snap = await getDocs(collection(db, "growth_students"));
    const data = snap.docs.map((d) => ({
      id: d.id,
      status: "Enrolled",
      ...d.data()
    })) as Student[];
    setStudents(data);
  }

  async function fetchCourses() {
    const snap = await getDocs(collection(db, "courses"));
    const data = snap.docs.map((d) => ({
      id: d.id,
      name: d.data().name
    })) as Course[];
    setCourses(data);
  }

  /* ---------------- Updates ---------------- */

  async function updateCourse(studentId: string, courseId: string) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    await updateDoc(doc(db, "growth_students", studentId), {
      courseId: course.id,
      courseName: course.name
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, courseId: course.id, courseName: course.name }
          : s
      )
    );
    setEditingCourse(null);
  }

  async function updateStatus(studentId: string, status: StudentStatus) {
    await updateDoc(doc(db, "growth_students", studentId), { status });

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
    setEditingStatus(null);
  }

  /* ---------------- UI Helpers ---------------- */

  const statusColor = (status: StudentStatus) => {
    if (status === "Active") return "bg-blue-600";
    if (status === "Completed") return "bg-green-600";
    return "bg-gray-600";
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white">Students</h1>
      <p className="text-sm text-gray-400 mb-6">
        Growth School — Student Management
      </p>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm text-gray-300">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-5 py-4">Student</th>
              <th className="text-left px-5 py-4">Course</th>
              <th className="text-left px-5 py-4">Status</th>
              <th className="text-right px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) => (
              <tr
                key={s.id}
                className="border-t border-white/5 hover:bg-white/5 transition"
              >
                {/* Student */}
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.email}</div>
                </td>

                {/* Course */}
                <td className="px-5 py-4">
                  {editingCourse === s.id ? (
                    <select
                      className="bg-black border border-white/20 rounded px-2 py-1"
                      defaultValue={s.courseId}
                      onChange={(e) =>
                        updateCourse(s.id, e.target.value)
                      }
                    >
                      <option value="">Select course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>
                        {s.courseName ?? (
                          <span className="text-gray-500">Not assigned</span>
                        )}
                      </span>
                      <button
                        onClick={() => setEditingCourse(s.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  {editingStatus === s.id ? (
                    <select
                      className="bg-black border border-white/20 rounded px-2 py-1"
                      defaultValue={s.status}
                      onChange={(e) =>
                        updateStatus(
                          s.id,
                          e.target.value as StudentStatus
                        )
                      }
                    >
                      <option>Enrolled</option>
                      <option>Active</option>
                      <option>Completed</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingStatus(s.id)}
                      className={`px-3 py-1 rounded-full text-xs text-white ${statusColor(
                        s.status
                      )}`}
                    >
                      {s.status}
                    </button>
                  )}
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
