"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type StudentStatus = "Enrolled" | "Active" | "Completed";

type Student = {
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

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [saving, setSaving] = useState(false);

  /* ---------------- Fetch ---------------- */

  useEffect(() => {
    fetchStudent();
    fetchCourses();
  }, []);

  async function fetchStudent() {
    const ref = doc(db, "growth_students", id as string);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setStudent(snap.data() as Student);
    }
  }

  async function fetchCourses() {
    const snap = await getDocs(collection(db, "courses"));
    setCourses(
      snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name
      }))
    );
  }

  /* ---------------- Updates ---------------- */

  async function updateField(field: Partial<Student>) {
    if (!student) return;
    setSaving(true);

    await updateDoc(doc(db, "growth_students", id as string), field);
    setStudent({ ...student, ...field });

    setSaving(false);
  }

  if (!student) {
    return (
      <div className="p-10 text-gray-400">Loading student profile…</div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back to students
        </button>

        <h1 className="text-2xl font-semibold text-white mt-3">
          {student.name}
        </h1>
        <p className="text-gray-400">{student.email}</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        {/* Course */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Course
          </label>
          <select
            value={student.courseId ?? ""}
            onChange={(e) =>
              updateField({
                courseId: e.target.value,
                courseName:
                  courses.find((c) => c.id === e.target.value)?.name
              })
            }
            className="w-full bg-black border border-white/20 rounded px-3 py-2"
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Status
          </label>
          <select
            value={student.status}
            onChange={(e) =>
              updateField({
                status: e.target.value as StudentStatus
              })
            }
            className="w-full bg-black border border-white/20 rounded px-3 py-2"
          >
            <option>Enrolled</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-gray-500">Student ID</p>
            <p className="text-sm text-gray-300 break-all">{id}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Saving status</p>
            <p className="text-sm">
              {saving ? (
                <span className="text-yellow-400">Saving…</span>
              ) : (
                <span className="text-green-400">All changes saved</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Future sections */}
      <div className="mt-10 text-gray-500 text-sm italic">
        Notes, activity timeline, mentor assignment — coming next
      </div>
    </div>
  );
}
